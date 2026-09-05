import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
export * from "./categories";
import { categories } from "./categories";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  // Clerk owns credentials. This column is intentionally always written as null.
  passwordHash: text("password_hash"),
  phoneNumber: text("phone_number"),
  city: text("city"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  condition: text("condition").notNull(),
  city: text("city").notNull(),
  image: text("image").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  description: text("description").notNull(),
  delivery: jsonb("delivery").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
}));

export const listingsRelations = relations(listings, ({ one }) => ({
  user: one(users, {
    fields: [listings.userId],
    references: [users.id],
  }),
  categoryRecord: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;