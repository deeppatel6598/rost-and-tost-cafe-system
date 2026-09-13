import { generateId } from "@/lib/format";
import { fields, sql, type Db } from "@/lib/db/sql";
import { definedOnly } from "@/lib/store/patch";
import type { Catalogue } from "@/lib/pricing";
import type { ItemAddon, ItemAddonGroup, ItemVariant, MenuCategory, MenuItem, MenuItemView } from "@/lib/types";

/* ── Categories ──────────────────────────────────────────────────────────── */

export async function listCategories(stallId: string): Promise<MenuCategory[]> {
  return sql<MenuCategory[]>`
    select * from menu_categories
    where stall_id = ${stallId} and is_active
    order by sort_order
  `;
}

export async function createCategory(stallId: string, name: string): Promise<MenuCategory> {
  const [row] = await sql<MenuCategory[]>`
    insert into menu_categories (id, stall_id, name, sort_order, is_active)
    values (
      ${generateId("cat")}, ${stallId}, ${name},
      (select coalesce(max(sort_order), -1) + 1 from menu_categories where stall_id = ${stallId}),
      true
    )
    returning *
  `;
  return row;
}

export async function updateCategory(
  stallId: string,
  id: string,
  patch: Partial<MenuCategory>,
): Promise<MenuCategory | undefined> {
  const { id: _i, stallId: _s, ...rest } = patch;
  const safe = definedOnly(rest);
  if (Object.keys(safe).length === 0) return undefined;
  const [row] = await sql<MenuCategory[]>`
    update menu_categories set ${sql(fields(safe))}
    where id = ${id} and stall_id = ${stallId}
    returning *
  `;
  return row;
}

/* ── Items ───────────────────────────────────────────────────────────────── */

type GroupRow = ItemAddonGroup & { addons: ItemAddon[] };

/**
 * Attaches variants and addon groups to a set of items in three queries rather
 * than three per item. A stall menu is ~10 items with ~3 relations each, and
 * the N+1 version was 30 round trips to Mumbai on the hottest read in the app.
 */
async function withRelations(items: MenuItem[]): Promise<MenuItemView[]> {
  if (items.length === 0) return [];
  const ids = items.map((i) => i.id);

  const [variants, groups] = await Promise.all([
    sql<ItemVariant[]>`select * from item_variants where item_id in ${sql(ids)} order by sort_order`,
    sql<ItemAddonGroup[]>`select * from item_addon_groups where item_id in ${sql(ids)} order by sort_order`,
  ]);

  const groupIds = groups.map((g) => g.id);
  const addons = groupIds.length
    ? await sql<ItemAddon[]>`select * from item_addons where group_id in ${sql(groupIds)}`
    : [];

  const addonsByGroup = new Map<string, ItemAddon[]>();
  for (const addon of addons) {
    const list = addonsByGroup.get(addon.groupId) ?? [];
    list.push(addon);
    addonsByGroup.set(addon.groupId, list);
  }

  const variantsByItem = new Map<string, ItemVariant[]>();
  for (const variant of variants) {
    const list = variantsByItem.get(variant.itemId) ?? [];
    list.push(variant);
    variantsByItem.set(variant.itemId, list);
  }

  const groupsByItem = new Map<string, GroupRow[]>();
  for (const group of groups) {
    const list = groupsByItem.get(group.itemId) ?? [];
    list.push({ ...group, addons: addonsByGroup.get(group.id) ?? [] });
    groupsByItem.set(group.itemId, list);
  }

  return items.map((item) => ({
    ...item,
    variants: variantsByItem.get(item.id) ?? [],
    addonGroups: groupsByItem.get(item.id) ?? [],
  }));
}

/** Everything on a stall's menu, including sold-out items (never hidden). */
export async function listStallMenu(stallId: string): Promise<MenuItemView[]> {
  const items = await sql<MenuItem[]>`
    select * from menu_items
    where stall_id = ${stallId} and is_active
    order by sort_order
  `;
  return withRelations(items);
}

export async function getItem(id: string): Promise<MenuItem | undefined> {
  const [row] = await sql<MenuItem[]>`select * from menu_items where id = ${id} and is_active`;
  return row;
}

export async function getItemView(id: string): Promise<MenuItemView | undefined> {
  const item = await getItem(id);
  if (!item) return undefined;
  const [view] = await withRelations([item]);
  return view;
}

export type CreateItemInput = Omit<MenuItem, "id" | "isActive">;

export async function createItem(input: CreateItemInput): Promise<MenuItem> {
  const [row] = await sql<MenuItem[]>`
    insert into menu_items ${sql(fields({ ...input, id: generateId("item"), isActive: true }))}
    returning *
  `;
  return row;
}

/**
 * Scoped by stallId on purpose — an id alone must never be enough to edit
 * another stall's menu, even if a route handler forgets to check.
 */
export async function updateItem(
  stallId: string,
  id: string,
  patch: Partial<MenuItem>,
): Promise<MenuItem | undefined> {
  const { id: _i, stallId: _s, ...rest } = patch;
  const safe = definedOnly(rest);
  if (Object.keys(safe).length === 0) return getItem(id);
  const [row] = await sql<MenuItem[]>`
    update menu_items set ${sql(fields(safe))}
    where id = ${id} and stall_id = ${stallId}
    returning *
  `;
  return row;
}

/** Soft delete — order history keeps pointing at the row. */
export async function deactivateItem(stallId: string, id: string): Promise<boolean> {
  const rows = await sql`
    update menu_items set is_active = false
    where id = ${id} and stall_id = ${stallId}
    returning id
  `;
  return rows.length > 0;
}

export async function setItemAvailability(
  stallId: string,
  id: string,
  isAvailable: boolean,
): Promise<MenuItem | undefined> {
  return updateItem(stallId, id, { isAvailable });
}

/* ── Variants and addons ─────────────────────────────────────────────────── */

export async function getVariant(id: string, tx: Db = sql): Promise<ItemVariant | undefined> {
  const [row] = await tx<ItemVariant[]>`select * from item_variants where id = ${id}`;
  return row;
}

export async function getAddon(id: string, tx: Db = sql): Promise<ItemAddon | undefined> {
  const [row] = await tx<ItemAddon[]>`select * from item_addons where id = ${id}`;
  return row;
}

export async function getAddonGroup(id: string): Promise<ItemAddonGroup | undefined> {
  const [row] = await sql<ItemAddonGroup[]>`select * from item_addon_groups where id = ${id}`;
  return row;
}

/**
 * Replace-in-place, in a transaction: the menu editor sends the whole list
 * back, so a half-applied delete-then-insert would leave an item with no
 * sizes at all. Addons cascade from their group.
 */
export async function replaceItemVariants(
  itemId: string,
  variants: Omit<ItemVariant, "itemId">[],
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`delete from item_variants where item_id = ${itemId}`;
    for (const [i, v] of variants.entries()) {
      await tx`
        insert into item_variants (id, item_id, name, price_delta, is_available, sort_order)
        values (${v.id || generateId("var")}, ${itemId}, ${v.name}, ${v.priceDelta}, ${v.isAvailable}, ${i})
      `;
    }
  });
}

export async function replaceItemAddonGroups(
  itemId: string,
  groups: (Omit<ItemAddonGroup, "itemId"> & { addons: Omit<ItemAddon, "groupId">[] })[],
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`delete from item_addon_groups where item_id = ${itemId}`;
    for (const [i, group] of groups.entries()) {
      const groupId = group.id || generateId("grp");
      await tx`
        insert into item_addon_groups (id, item_id, name, min_select, max_select, is_required, sort_order)
        values (${groupId}, ${itemId}, ${group.name}, ${group.minSelect}, ${group.maxSelect}, ${group.isRequired}, ${i})
      `;
      for (const addon of group.addons) {
        await tx`
          insert into item_addons (id, group_id, name, price_delta, is_available)
          values (${addon.id || generateId("add")}, ${groupId}, ${addon.name}, ${addon.priceDelta}, ${addon.isAvailable})
        `;
      }
    }
  });
}

/**
 * Loads exactly the menu rows a cart touches, locking the items.
 *
 * `for update` on menu_items is the sold-out race fix. Two students racing for
 * the last plate serialise here: the first transaction holds the row until it
 * commits, the second then reads the *updated* row and fails its availability
 * check. The previous in-memory version relied on Node's single thread, which
 * stops being true the moment there is more than one server process.
 *
 * Locks only menu_items — variants and addons are read consistently within the
 * same transaction snapshot, and locking them too would widen the contention
 * for no gain.
 */
export async function loadCatalogue(itemIds: string[], tx: Db = sql): Promise<Catalogue> {
  const unique = [...new Set(itemIds)].filter(Boolean);
  const empty: Catalogue = {
    items: new Map(),
    variantsByItem: new Map(),
    groupsByItem: new Map(),
    addons: new Map(),
  };
  if (unique.length === 0) return empty;

  const items = await tx<MenuItem[]>`
    select * from menu_items where id in ${tx(unique)} order by id for update
  `;
  if (items.length === 0) return empty;

  const ids = items.map((i) => i.id);
  const [variants, groups] = await Promise.all([
    tx<ItemVariant[]>`select * from item_variants where item_id in ${tx(ids)} order by sort_order`,
    tx<ItemAddonGroup[]>`select * from item_addon_groups where item_id in ${tx(ids)} order by sort_order`,
  ]);

  const groupIds = groups.map((g) => g.id);
  const addons = groupIds.length
    ? await tx<ItemAddon[]>`select * from item_addons where group_id in ${tx(groupIds)}`
    : [];

  const catalogue: Catalogue = {
    items: new Map(items.map((i) => [i.id, i])),
    variantsByItem: new Map(),
    groupsByItem: new Map(),
    addons: new Map(addons.map((a) => [a.id, a])),
  };
  for (const v of variants) {
    catalogue.variantsByItem.set(v.itemId, [...(catalogue.variantsByItem.get(v.itemId) ?? []), v]);
  }
  for (const g of groups) {
    catalogue.groupsByItem.set(g.itemId, [...(catalogue.groupsByItem.get(g.itemId) ?? []), g]);
  }
  return catalogue;
}
