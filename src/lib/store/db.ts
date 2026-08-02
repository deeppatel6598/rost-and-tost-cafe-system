import { SEED_CATEGORIES, SEED_MENU_ITEMS, SEED_SETTINGS, SEED_TABLES } from "@/data/seed";
import type { CafeSettings, Category, ContactMessage, MenuItem, Order, Table } from "@/lib/types";

/**
 * Process-local in-memory "database". No persistence layer yet — this is the
 * whole point right now (ship fast, connect a real database later without
 * touching callers). Every module in src/lib/store/*.ts reads and writes
 * through this single object, so swapping it for Prisma/Supabase/etc. later
 * means rewriting the functions in this folder, not the API routes or UI.
 *
 * The `globalThis` stash keeps state stable across Next.js dev hot-reloads.
 * In a serverless deployment with multiple instances, each instance gets its
 * own copy — fine for a single-process launch, not a substitute for a real
 * database once traffic grows. See README for the upgrade path.
 */
export interface Database {
  categories: Category[];
  menuItems: MenuItem[];
  tables: Table[];
  orders: Order[];
  settings: CafeSettings;
  contactMessages: ContactMessage[];
  orderSequence: number;
}

function createDatabase(): Database {
  return {
    categories: structuredClone(SEED_CATEGORIES),
    menuItems: structuredClone(SEED_MENU_ITEMS),
    tables: structuredClone(SEED_TABLES),
    orders: [],
    settings: structuredClone(SEED_SETTINGS),
    contactMessages: [],
    orderSequence: 100,
  };
}

const globalForDb = globalThis as unknown as { __rtDb?: Database };

export const db: Database = globalForDb.__rtDb ?? (globalForDb.__rtDb = createDatabase());
