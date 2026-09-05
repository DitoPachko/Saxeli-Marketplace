import { relations } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").references((): any => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  slug: text("slug").notNull().unique(),
  depth: integer("depth").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "categoryTree" }),
  children: many(categories, { relationName: "categoryTree" }),
}));

export type Category = typeof categories.$inferSelect;