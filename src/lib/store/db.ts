import {
  SEED_ADDONS,
  SEED_ADDON_GROUPS,
  SEED_CATEGORIES,
  SEED_ITEMS,
  SEED_STAFF,
  SEED_STALLS,
  SEED_TABLES,
  SEED_VARIANTS,
} from "@/data/seed";
import type {
  AuditLog,
  DiningTable,
  ItemAddon,
  ItemAddonGroup,
  ItemVariant,
  MenuCategory,
  MenuItem,
  Order,
  Stall,
  StaffUser,
  SubOrder,
  SubOrderItem,
} from "@/lib/types";

/**
 * Process-local in-memory database.
 *
 * Every read and write in the app goes through the repository functions in
 * this folder, never through this object directly, so swapping in Postgres
 * later means rewriting these files and nothing else.
 *
 * Two things to know about the current storage:
 *
 * 1. It is per-process. On a single always-on Node server (`next start`) all
 *    four stalls and every guest share one consistent view. On multi-instance
 *    serverless hosting each instance keeps its own copy, so orders placed
 *    against one instance may not be visible to another. That makes this
 *    suitable for a pilot on one server, not for the real canteen rush.
 *
 * 2. Node runs one JavaScript thread, so any *synchronous* function here runs
 *    to completion without interleaving. The sold-out check and the
 *    idempotency check in orders.ts rely on that: they read and write inside
 *    a single synchronous block, which is what makes them atomic here. When
 *    this moves to a real database those same blocks must become a
 *    transaction with a row-level check — the comments there mark the spots.
 */
export interface Database {
  stalls: Stall[];
  categories: MenuCategory[];
  items: MenuItem[];
  variants: ItemVariant[];
  addonGroups: ItemAddonGroup[];
  addons: ItemAddon[];
  tables: DiningTable[];
  orders: Order[];
  subOrders: SubOrder[];
  subOrderItems: SubOrderItem[];
  staff: StaffUser[];
  auditLogs: AuditLog[];
  /** idempotency key → order id, so a double-tap returns the first order. */
  idempotency: Map<string, string>;
}

function createDatabase(): Database {
  return {
    stalls: structuredClone(SEED_STALLS),
    categories: structuredClone(SEED_CATEGORIES),
    items: structuredClone(SEED_ITEMS),
    variants: structuredClone(SEED_VARIANTS),
    addonGroups: structuredClone(SEED_ADDON_GROUPS),
    addons: structuredClone(SEED_ADDONS),
    tables: structuredClone(SEED_TABLES),
    orders: [],
    subOrders: [],
    subOrderItems: [],
    staff: structuredClone(SEED_STAFF),
    auditLogs: [],
    idempotency: new Map(),
  };
}

const globalForDb = globalThis as unknown as { __skCanteenDb?: Database };

export const db: Database = globalForDb.__skCanteenDb ?? (globalForDb.__skCanteenDb = createDatabase());
