import { asc, eq } from "drizzle-orm";
import { categories, db, flattenCategoryTree } from "@workspace/db";

let seedPromise: Promise<void> | null = null;

export function ensureCategoryCatalog() {
  if (!seedPromise) {
    seedPromise = (async () => {
      for (const category of flattenCategoryTree()) {
        await db
          .insert(categories)
          .values({
            id: category.slug,
            parentId: category.parentSlug,
            name: category.name,
            icon: category.icon ?? null,
            slug: category.slug,
            depth: category.depth,
            sortOrder: category.sortOrder,
          })
          .onConflictDoUpdate({
            target: categories.id,
            set: {
              parentId: category.parentSlug,
              name: category.name,
              icon: category.icon ?? null,
              depth: category.depth,
              sortOrder: category.sortOrder,
            },
          });
      }
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

export async function getCategoryCatalog() {
  await ensureCategoryCatalog();
  return db.select().from(categories).orderBy(asc(categories.depth), asc(categories.sortOrder), asc(categories.name));
}

export async function resolveCategory(value: string) {
  await ensureCategoryCatalog();
  const [category] = await db.select().from(categories).where(eq(categories.slug, value));
  return category;
}

export async function categoryAndDescendantIds(value: string) {
  const catalog = await getCategoryCatalog();
  const selected = catalog.find((entry) => entry.id === value || entry.slug === value);
  if (!selected) return [];
  const included = new Set([selected.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of catalog) {
      if (category.parentId && included.has(category.parentId) && !included.has(category.id)) {
        included.add(category.id);
        changed = true;
      }
    }
  }
  return [...included];
}