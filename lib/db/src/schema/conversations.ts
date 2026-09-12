import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { listings, users } from "./index";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: text("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    listingBuyerUnique: uniqueIndex("conversations_listing_buyer_unique").on(table.listingId, table.buyerId),
    listingIndex: index("conversations_listing_idx").on(table.listingId),
    buyerIndex: index("conversations_buyer_idx").on(table.buyerId),
    sellerIndex: index("conversations_seller_idx").on(table.sellerId),
  }),
);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  listing: one(listings, { fields: [conversations.listingId], references: [listings.id] }),
  buyer: one(users, { fields: [conversations.buyerId], references: [users.id], relationName: "buyerConversations" }),
  seller: one(users, { fields: [conversations.sellerId], references: [users.id], relationName: "sellerConversations" }),
  messages: many(messages),
}));

// Imported below to keep the table modules independently usable while avoiding
// a second relation declaration in the schema barrel.
import { messages } from "./messages";

export type Conversation = typeof conversations.$inferSelect;