/**
 * Loads the seed data into Postgres.
 *
 *   npm run db:seed            apply it (needs DATABASE_URL)
 *   npm run db:seed -- --print write the SQL to stdout instead
 *
 * The --print mode exists because the schema and the seed have to be
 * applied before the app has a connection string — it lets the same
 * single source of truth (src/data/seed.ts) be piped into whichever console
 * or migration tool is to hand, rather than keeping a second copy of the menu
 * in a .sql file that will drift.
 *
 * Reference rows (stalls, menu, tables, staff) are upserted, so re-running is
 * safe and is how a menu change reaches an existing database. Orders, visits
 * and audit logs are never touched.
 */
import {
  SEED_ADDONS,
  SEED_ADDON_GROUPS,
  SEED_CATEGORIES,
  SEED_ITEMS,
  SEED_STAFF,
  SEED_STALLS,
  SEED_TABLES,
  SEED_VARIANTS,
} from "../src/data/seed";

const lit = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
};

const row = (values: unknown[]) => `(${values.map(lit).join(", ")})`;

function upsert(table: string, columns: string[], rows: unknown[][], conflictKey = "id"): string {
  if (rows.length === 0) return "";
  const updates = columns
    .filter((c) => c !== conflictKey)
    .map((c) => `${c} = excluded.${c}`)
    .join(",\n    ");
  return [
    `insert into ${table} (${columns.join(", ")}) values`,
    rows.map(row).join(",\n"),
    `on conflict (${conflictKey}) do update set`,
    `    ${updates};`,
  ].join("\n");
}

export function buildSeedSql(): string {
  const statements = [
    upsert(
      "stalls",
      ["id", "name", "description", "art", "upi_vpa", "upi_payee_name", "gstin", "service_mode",
        "is_paused", "opens_at", "closes_at", "accepts_cash", "accepts_upi", "menu_layout",
        "tagline", "token_prefix", "sort_order"],
      SEED_STALLS.map((s) => [
        s.id, s.name, s.description, s.art, s.upiVpa, s.upiPayeeName, s.gstin ?? null,
        s.serviceMode, s.isPaused, s.opensAt, s.closesAt, s.acceptsCash, s.acceptsUpi,
        s.menuLayout, s.tagline, s.tokenPrefix, s.sortOrder,
      ]),
    ),
    upsert(
      "menu_categories",
      ["id", "stall_id", "name", "sort_order", "is_active"],
      SEED_CATEGORIES.map((c) => [c.id, c.stallId, c.name, c.sortOrder, c.isActive]),
    ),
    upsert(
      "menu_items",
      ["id", "stall_id", "category_id", "name", "description", "base_price", "image_url", "art",
        "food_type", "is_available", "is_active", "sort_order"],
      SEED_ITEMS.map((i) => [
        i.id, i.stallId, i.categoryId, i.name, i.description, i.basePrice,
        i.imageUrl ?? null, i.art ?? null, i.foodType, i.isAvailable, i.isActive, i.sortOrder,
      ]),
    ),
    upsert(
      "item_variants",
      ["id", "item_id", "name", "price_delta", "is_available", "sort_order"],
      SEED_VARIANTS.map((v) => [v.id, v.itemId, v.name, v.priceDelta, v.isAvailable, v.sortOrder]),
    ),
    upsert(
      "item_addon_groups",
      ["id", "item_id", "name", "min_select", "max_select", "is_required", "sort_order"],
      SEED_ADDON_GROUPS.map((g) => [g.id, g.itemId, g.name, g.minSelect, g.maxSelect, g.isRequired, g.sortOrder]),
    ),
    upsert(
      "item_addons",
      ["id", "group_id", "name", "price_delta", "is_available"],
      SEED_ADDONS.map((a) => [a.id, a.groupId, a.name, a.priceDelta, a.isAvailable]),
    ),
    upsert(
      "dining_tables",
      ["id", "table_number", "qr_token", "is_active"],
      SEED_TABLES.map((t) => [t.id, t.tableNumber, t.qrToken, t.isActive]),
    ),
    upsert(
      "staff_users",
      ["id", "stall_id", "name", "phone", "password_hash", "role", "is_active"],
      SEED_STAFF.map((s) => [s.id, s.stallId, s.name, s.phone, s.passwordHash, s.role, s.isActive]),
    ),
  ];

  return statements.filter(Boolean).join("\n\n");
}

async function main() {
  const sqlText = buildSeedSql();

  if (process.argv.includes("--print")) {
    process.stdout.write(`${sqlText}\n`);
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Use --print to emit the SQL instead.");
    process.exit(1);
  }

  const { sql } = await import("../src/lib/db/sql");
  await sql.unsafe(sqlText);
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from menu_items`;
  console.log(`Seeded. ${SEED_STALLS.length} stalls, ${count} menu items, ${SEED_TABLES.length} tables.`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
