import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
export * from "./categories";
import { categories } from "./categories";
import { conversations } from "./conversations";
import { messages } from "./messages";
export { conversations, conversationsRelations, type Conversation } from "./conversations";
export { messages, messagesRelations, type Message } from "./messages";

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
  status: text("status").notNull().default("standard"),
  vipExpiresAt: timestamp("vip_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  listingId: uuid("listing_id")
    .references(() => listings.id, { onDelete: "set null" }),
  tier: text("tier").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  provider: text("provider").notNull().default("test"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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
  buyerConversations: many(conversations, { relationName: "buyerConversations" }),
  sellerConversations: many(conversations, { relationName: "sellerConversations" }),
  sentMessages: many(messages),
  payments: many(payments),
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
  conversations: many(conversations),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [payments.listingId],
    references: [listings.id],
  }),
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
export type Payment = typeof payments.$inferSelect;