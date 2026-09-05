import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import {
  GetCurrentProfileResponse,
  GetProfileSummaryResponse,
  GetSellerProfileParams,
  GetSellerProfileResponse,
  ListMessagesResponse,
  UpdateCurrentProfileBody,
  UpdateCurrentProfileResponse,
} from "@workspace/api-zod";
import { db, listings, users } from "@workspace/db";
import { getCurrentUser } from "../lib/currentUser";

const router: IRouter = Router();

function profile(user: {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  city: string | null;
  avatarUrl: string | null;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    city: user.city,
    avatarUrl: user.avatarUrl,
  };
}

router.get("/profile", async (req, res) => {
  res.json(GetCurrentProfileResponse.parse(profile(await getCurrentUser(req))));
});

router.patch("/profile", async (req, res) => {
  const parsed = UpdateCurrentProfileBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "პროფილის მონაცემები არასწორია" });
  const current = await getCurrentUser(req);
  const [updated] = await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date(), passwordHash: null })
    .where(eq(users.id, current.id))
    .returning();
  res.json(UpdateCurrentProfileResponse.parse(profile(updated)));
});

router.get("/sellers/:id", async (req, res) => {
  const parsed = GetSellerProfileParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "გამყიდველის იდენტიფიკატორი არასწორია" });
  const [seller] = await db.select().from(users).where(eq(users.id, parsed.data.id));
  if (!seller) return void res.status(404).json({ error: "გამყიდველი ვერ მოიძებნა" });
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listings)
    .where(eq(listings.userId, seller.id));
  res.json(
    GetSellerProfileResponse.parse({
      id: seller.id,
      fullName: seller.fullName,
      city: seller.city,
      avatarUrl: seller.avatarUrl,
      listings: result?.count ?? 0,
    }),
  );
});

router.get("/profile/summary", async (req, res) => {
  const user = await getCurrentUser(req);
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listings)
    .where(eq(listings.userId, user.id));
  res.json(
    GetProfileSummaryResponse.parse({
      name: user.fullName,
      initials: user.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      rating: 0,
      activeListings: result?.count ?? 0,
      savedItems: 0,
      unreadMessages: 0,
    }),
  );
});

router.get("/messages", async (_req, res) => {
  // Messages are not yet modeled, so return the truthful empty inbox rather than fixtures.
  res.json(ListMessagesResponse.parse([]));
});

export default router;