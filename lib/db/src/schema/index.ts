import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
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
  district: text("district").notNull().default(""),
  image: text("image").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  description: text("description").notNull(),
  delivery: jsonb("delivery").$type<string[]>().notNull().default([]),
  negotiable: boolean("negotiable").notNull().default(false),
  tradeAvailable: boolean("trade_available").notNull().default(false),
  deliveryAvailable: boolean("delivery_available").notNull().default(false),
  phone: text("phone"),
  chatOnly: boolean("chat_only").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.userId, table.listingId] }),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  favorites: many(favorites),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  user: one(users, {
    fields: [listings.userId],
    references: [users.id],
  }),
  categoryRecord: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
  favorites: many(favorites),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [favorites.listingId],
    references: [listings.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;