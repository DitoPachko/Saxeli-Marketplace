import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import {
  CreateItemBody,
  CreateItemResponse,
  DeleteItemParams,
  GetItemParams,
  GetItemResponse,
  ListItemsQueryParams,
  ListItemsResponse,
  ListCategoriesResponse,
  ListMyItemsResponse,
  PurchaseTestVipBody,
  PurchaseTestVipParams,
  PurchaseTestVipResponse,
  ToggleItemFavoriteParams,
  ToggleItemFavoriteResponse,
  UpdateItemBody,
  UpdateItemParams,
  UpdateItemResponse,
} from "@workspace/api-zod";
import { db, favorites, listings, payments, users, type Listing, type User } from "@workspace/db";
import { getCurrentUser } from "../lib/currentUser";
import { categoryAndDescendantIds, getCategoryCatalog, resolveCategory } from "../lib/categoryCatalog";

const router: IRouter = Router();

function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function postedAt(createdAt: Date) {
  const elapsed = Date.now() - createdAt.getTime();
  if (elapsed < 60 * 60 * 1000) return "ახლახან";
  if (elapsed < 24 * 60 * 60 * 1000) return "დღეს";
  return createdAt.toLocaleDateString("ka-GE");
}

function item(listing: Listing, user: User, listingCount: number, isFavorite = false) {
  const hasActivePromotion = Boolean(listing.vipExpiresAt && listing.vipExpiresAt.getTime() > Date.now());
  const promotionStatus =
    hasActivePromotion && (listing.status === "vip" || listing.status === "super_vip")
      ? listing.status
      : "standard";

  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    category: listing.category,
    categorySlug: listing.categoryId ?? "other",
    condition: listing.condition,
    city: listing.city,
    district: listing.district,
    postedAt: postedAt(listing.createdAt),
    image: listing.image,
    images: listing.images,
    description: listing.description,
    seller: {
      id: user.id,
      name: user.fullName,
      initials: initials(user.fullName),
      rating: 0,
      listings: listingCount,
      avatarUrl: user.avatarUrl,
      city: user.city,
      phoneNumber: user.phoneNumber,
    },
    isFavorite,
    delivery: listing.delivery,
    negotiable: listing.negotiable,
    tradeAvailable: listing.tradeAvailable,
    deliveryAvailable: listing.deliveryAvailable,
    phone: listing.phone,
    chatOnly: listing.chatOnly,
    promotionStatus,
    vipExpiresAt: promotionStatus === "standard" ? null : listing.vipExpiresAt?.toISOString() ?? null,
  };
}

async function favoriteListingIds(userId: string | null | undefined, listingIds: string[]) {
  if (!userId || listingIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ listingId: favorites.listingId })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), inArray(favorites.listingId, listingIds)));
  return new Set(rows.map((row) => row.listingId));
}

async function listingCount(userId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listings)
    .where(eq(listings.userId, userId));
  return result?.count ?? 0;
}

async function findItem(id: string) {
  const [row] = await db
    .select({ listing: listings, user: users })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .where(eq(listings.id, id));
  return row;
}

router.get("/items", async (req, res) => {
  const parsed = ListItemsQueryParams.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ error: "ფილტრის მონაცემები არასწორია" });

  const { search, category, city, minPrice, maxPrice, sort, limit } = parsed.data;
  const categoryIds = category ? await categoryAndDescendantIds(category) : [];
  const filters = [
    category
      ? categoryIds.length
        ? inArray(listings.categoryId, categoryIds)
        : eq(listings.categoryId, "__unknown_category__")
      : undefined,
    city ? eq(listings.city, city) : undefined,
    minPrice !== undefined ? gte(listings.price, minPrice) : undefined,
    maxPrice !== undefined ? lte(listings.price, maxPrice) : undefined,
    search
      ? or(
          ilike(listings.title, `%${search.trim()}%`),
          ilike(listings.category, `%${search.trim()}%`),
          ilike(listings.city, `%${search.trim()}%`),
        )
      : undefined,
  ].filter(Boolean);
  const rows = await db
    .select({ listing: listings, user: users })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(
      sql`case
        when ${listings.status} = 'super_vip' and ${listings.vipExpiresAt} > now() then 2
        when ${listings.status} = 'vip' and ${listings.vipExpiresAt} > now() then 1
        else 0
      end desc`,
      sort === "price_asc"
        ? asc(listings.price)
        : sort === "price_desc"
          ? desc(listings.price)
          : desc(listings.createdAt),
      desc(listings.createdAt),
    )
    .limit(limit);
  const favoriteIds = await favoriteListingIds(getAuth(req).userId, rows.map((row) => row.listing.id));
  const counts = await Promise.all(rows.map((row) => listingCount(row.user.id)));
  res.json(ListItemsResponse.parse(rows.map((row, index) => item(row.listing, row.user, counts[index], favoriteIds.has(row.listing.id)))));
});

router.get("/categories", async (_req, res) => {
  const catalog = await getCategoryCatalog();
  res.json(ListCategoriesResponse.parse(catalog));
});

router.post("/items", async (req, res) => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "განცხადების მონაცემები არასწორია" });
  const user = await getCurrentUser(req);
  const category = await resolveCategory(parsed.data.category);
  if (!category) return void res.status(400).json({ error: "აირჩიეთ სწორი კატეგორია" });
  const [listing] = await db
    .insert(listings)
    .values({ ...parsed.data, category: category.name, categoryId: category.id, userId: user.id, images: [parsed.data.image], delivery: parsed.data.delivery ?? [] })
    .returning();
  res.status(201).json(CreateItemResponse.parse(item(listing, user, await listingCount(user.id))));
});

router.get("/items/:id", async (req, res) => {
  const parsed = GetItemParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "ნივთის იდენტიფიკატორი არასწორია" });
  const row = await findItem(parsed.data.id);
  if (!row) return void res.status(404).json({ error: "ნივთი ვერ მოიძებნა" });
  const favoriteIds = await favoriteListingIds(getAuth(req).userId, [row.listing.id]);
  res.json(GetItemResponse.parse(item(row.listing, row.user, await listingCount(row.user.id), favoriteIds.has(row.listing.id))));
});

router.post("/items/:id/vip", async (req, res): Promise<void> => {
  const params = PurchaseTestVipParams.safeParse(req.params);
  const body = PurchaseTestVipBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "VIP პაკეტის მონაცემები არასწორია" });
    return;
  }

  const user = await getCurrentUser(req);
  const tier = body.data.tier;
  const amount = tier === "super_vip" ? 7 : 3;

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select ${listings.id} from ${listings} where ${listings.id} = ${params.data.id} for update`);
    const [lockedListing] = await tx
      .select()
      .from(listings)
      .where(eq(listings.id, params.data.id));
    if (!lockedListing) return { error: "not_found" as const };
    if (lockedListing.userId !== user.id) return { error: "forbidden" as const };

    const now = new Date();
    const baseTime = lockedListing.vipExpiresAt && lockedListing.vipExpiresAt.getTime() > now.getTime()
      ? lockedListing.vipExpiresAt
      : now;
    const vipExpiresAt = new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [payment] = await tx
      .insert(payments)
      .values({
        userId: user.id,
        listingId: lockedListing.id,
        tier,
        amount: amount.toFixed(2),
        status: "pending",
        provider: "test",
      })
      .returning();
    const transactionId = `test_${payment.id}`;
    await tx
      .update(payments)
      .set({ status: "completed", transactionId })
      .where(eq(payments.id, payment.id));
    const [promotedListing] = await tx
      .update(listings)
      .set({ status: tier, vipExpiresAt, updatedAt: new Date() })
      .where(and(eq(listings.id, lockedListing.id), eq(listings.userId, user.id)))
      .returning();
    return { payment, promotedListing, vipExpiresAt };
  });

  if ("error" in result) {
    if (result.error === "not_found") {
      res.status(404).json({ error: "ნივთი ვერ მოიძებნა" });
      return;
    }
    res.status(403).json({ error: "მხოლოდ განცხადების მფლობელს შეუძლია მისი VIP-ად ქცევა" });
    return;
  }

  res.json(PurchaseTestVipResponse.parse({
    paymentId: result.payment.id,
    tier,
    amount,
    status: "completed",
    provider: "test",
    vipExpiresAt: result.vipExpiresAt.toISOString(),
    item: item(result.promotedListing, user, await listingCount(user.id)),
  }));
});

router.get("/favorites", async (req, res) => {
  const user = await getCurrentUser(req);
  const rows = await db
    .select({ listing: listings, seller: users })
    .from(favorites)
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .innerJoin(users, eq(listings.userId, users.id))
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.createdAt));
  const counts = await Promise.all(rows.map((row) => listingCount(row.seller.id)));
  res.json(ListItemsResponse.parse(rows.map((row, index) => item(row.listing, row.seller, counts[index], true))));
});

router.get("/profile/listings", async (req, res) => {
  const user = await getCurrentUser(req);
  const ownListings = await db.select().from(listings).where(eq(listings.userId, user.id)).orderBy(desc(listings.createdAt));
  const count = ownListings.length;
  res.json(ListMyItemsResponse.parse(ownListings.map((listing) => item(listing, user, count))));
});

router.patch("/items/:id", async (req, res) => {
  const params = UpdateItemParams.safeParse(req.params);
  const body = UpdateItemBody.safeParse(req.body);
  if (!params.success || !body.success) return void res.status(400).json({ error: "განცხადების მონაცემები არასწორია" });
  const user = await getCurrentUser(req);
  const row = await findItem(params.data.id);
  if (!row) return void res.status(404).json({ error: "ნივთი ვერ მოიძებნა" });
  if (row.listing.userId !== user.id) return void res.status(403).json({ error: "არ გაქვთ ამ განცხადების შეცვლის უფლება" });
  const category = body.data.category ? await resolveCategory(body.data.category) : null;
  if (body.data.category && !category) return void res.status(400).json({ error: "აირჩიეთ სწორი კატეგორია" });
  const update = {
    ...body.data,
    ...(category ? { category: category.name, categoryId: category.id } : {}),
    updatedAt: new Date(),
  };
  const [listing] = await db.update(listings).set(update).where(eq(listings.id, row.listing.id)).returning();
  res.json(UpdateItemResponse.parse(item(listing, user, await listingCount(user.id))));
});

router.delete("/items/:id", async (req, res) => {
  const params = DeleteItemParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: "ნივთის იდენტიფიკატორი არასწორია" });
  const user = await getCurrentUser(req);
  const row = await findItem(params.data.id);
  if (!row) return void res.status(404).json({ error: "ნივთი ვერ მოიძებნა" });
  if (row.listing.userId !== user.id) return void res.status(403).json({ error: "არ გაქვთ ამ განცხადების წაშლის უფლება" });
  await db.delete(listings).where(eq(listings.id, row.listing.id));
  res.status(204).end();
});

router.post("/items/:id", async (req, res) => {
  const parsed = ToggleItemFavoriteParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "ნივთის იდენტიფიკატორი არასწორია" });
  const row = await findItem(parsed.data.id);
  if (!row) return void res.status(404).json({ error: "ნივთი ვერ მოიძებნა" });
  const user = await getCurrentUser(req);
  const [existing] = await db
    .select({ listingId: favorites.listingId })
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.listingId, row.listing.id)));

  if (existing) {
    await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.listingId, row.listing.id)));
  } else {
    await db.insert(favorites).values({ userId: user.id, listingId: row.listing.id });
  }

  res.json(ToggleItemFavoriteResponse.parse({ id: row.listing.id, isFavorite: !existing }));
});

export default router;