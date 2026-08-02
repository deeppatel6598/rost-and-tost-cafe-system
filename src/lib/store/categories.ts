import { db } from "@/lib/store/db";
import type { Category } from "@/lib/types";

export function listCategories(): Category[] {
  return [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategory(id: string): Category | undefined {
  return db.categories.find((c) => c.id === id);
}
