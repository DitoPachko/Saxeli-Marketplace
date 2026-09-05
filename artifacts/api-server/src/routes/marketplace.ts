import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  CreateItemBody,
  CreateItemResponse,
  DeleteItemParams,
  GetItemParams,
  GetItemResponse,
  ListItemsQueryParams,
  ListItemsResponse,
  ListMyItemsResponse,
  ToggleItemFavoriteParams,
  ToggleItemFavoriteResponse,
  UpdateItemBody,
  UpdateItemParams,
  UpdateItemResponse,
} from "@workspace/api-zod";
import { db, listings, users, type Listing, type User } from "@workspace/db";
import { getCurrentUser } from "../lib/currentUser";

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

function item(listing: Listing, user: User, listingCount: number) {
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    category: listing.category,
    condition: listing.condition,
    city: listing.city,
    postedAt: postedAt(listing.createdAt),
    image: listing.image,
    images: listing.images,
    description: listing.description,
    seller: {
      name: user.fullName,
      initials: initials(user.fullName),
      rating: 0,
      listings: listingCount,
    },
    isFavorite: false,
    delivery: listing.delivery,
  };
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

  const { search, category, city, limit } = parsed.data;
  const filters = [
    category && category !== "ყველა ნივთი" ? eq(listings.category, category) : undefined,
    city ? eq(listings.city, city) : undefined,
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
    .orderBy(desc(listings.createdAt))
    .limit(limit);
  const counts = await Promise.all(rows.map((row) => listingCount(row.user.id)));
  res.json(ListItemsResponse.parse(rows.map((row, index) => item(row.listing, row.user, counts[index]))));
});

router.post("/items", async (req, res) => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "განცხადების მონაცემები არასწორია" });
  const user = await getCurrentUser(req);
  const [listing] = await db
    .insert(listings)
    .values({ ...parsed.data, userId: user.id, images: [parsed.data.image], delivery: parsed.data.delivery ?? [] })
    .returning();
  res.status(201).json(CreateItemResponse.parse(item(listing, user, await listingCount(user.id))));
});

router.get("/items/:id", async (req, res) => {
  const parsed = GetItemParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "ნივთის იდენტიფიკატორი არასწორია" });
  const row = await findItem(parsed.data.id);
  if (!row) return void res.status(404).json({ error: "ნივთი ვერ მოიძებნა" });
  res.json(GetItemResponse.parse(item(row.listing, row.user, await listingCount(row.user.id))));
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
  const [listing] = await db.update(listings).set({ ...body.data, updatedAt: new Date() }).where(eq(listings.id, row.listing.id)).returning();
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
  // Favorites are not persisted until a favorites model is introduced.
  res.json(ToggleItemFavoriteResponse.parse({ id: row.listing.id, isFavorite: false }));
});

export default router;