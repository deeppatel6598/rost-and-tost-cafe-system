import { generateId } from "@/lib/format";
import { db } from "@/lib/store/db";
import { definedOnly } from "@/lib/store/patch";
import type { ItemAddon, ItemAddonGroup, ItemVariant, MenuCategory, MenuItem, MenuItemView } from "@/lib/types";

/* ── Categories ──────────────────────────────────────────────────────────── */

export function listCategories(stallId: string): MenuCategory[] {
  return db.categories
    .filter((c) => c.stallId === stallId && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createCategory(stallId: string, name: string): MenuCategory {
  const maxSort = Math.max(-1, ...db.categories.filter((c) => c.stallId === stallId).map((c) => c.sortOrder));
  const category: MenuCategory = {
    id: generateId("cat"),
    stallId,
    name,
    sortOrder: maxSort + 1,
    isActive: true,
  };
  db.categories.push(category);
  return category;
}

export function updateCategory(stallId: string, id: string, patch: Partial<MenuCategory>): MenuCategory | undefined {
  const idx = db.categories.findIndex((c) => c.id === id && c.stallId === stallId);
  if (idx === -1) return undefined;
  const { id: _i, stallId: _s, ...safe } = patch;
  db.categories[idx] = { ...db.categories[idx], ...definedOnly(safe) };
  return db.categories[idx];
}

/* ── Items ───────────────────────────────────────────────────────────────── */

function withRelations(item: MenuItem): MenuItemView {
  const variants = db.variants
    .filter((v) => v.itemId === item.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const addonGroups = db.addonGroups
    .filter((g) => g.itemId === item.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => ({ ...g, addons: db.addons.filter((a) => a.groupId === g.id) }));
  return { ...item, variants, addonGroups };
}

/** Everything on a stall's menu, including sold-out items (never hidden). */
export function listStallMenu(stallId: string): MenuItemView[] {
  return db.items
    .filter((i) => i.stallId === stallId && i.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(withRelations);
}

export function getItem(id: string): MenuItem | undefined {
  return db.items.find((i) => i.id === id && i.isActive);
}

export function getItemView(id: string): MenuItemView | undefined {
  const item = getItem(id);
  return item ? withRelations(item) : undefined;
}

export type CreateItemInput = Omit<MenuItem, "id" | "isActive">;

export function createItem(input: CreateItemInput): MenuItem {
  const item: MenuItem = { ...input, id: generateId("item"), isActive: true };
  db.items.push(item);
  return item;
}

/**
 * Scoped by stallId on purpose — an id alone must never be enough to edit
 * another stall's menu, even if a route handler forgets to check.
 */
export function updateItem(stallId: string, id: string, patch: Partial<MenuItem>): MenuItem | undefined {
  const idx = db.items.findIndex((i) => i.id === id && i.stallId === stallId);
  if (idx === -1) return undefined;
  const { id: _i, stallId: _s, ...safe } = patch;
  db.items[idx] = { ...db.items[idx], ...definedOnly(safe) };
  return db.items[idx];
}

/** Soft delete — order history keeps pointing at the row. */
export function deactivateItem(stallId: string, id: string): boolean {
  const item = db.items.find((i) => i.id === id && i.stallId === stallId);
  if (!item) return false;
  item.isActive = false;
  return true;
}

export function setItemAvailability(stallId: string, id: string, isAvailable: boolean): MenuItem | undefined {
  return updateItem(stallId, id, { isAvailable });
}

/* ── Variants and addons ─────────────────────────────────────────────────── */

export function getVariant(id: string): ItemVariant | undefined {
  return db.variants.find((v) => v.id === id);
}

export function getAddon(id: string): ItemAddon | undefined {
  return db.addons.find((a) => a.id === id);
}

export function getAddonGroup(id: string): ItemAddonGroup | undefined {
  return db.addonGroups.find((g) => g.id === id);
}

export function replaceItemVariants(itemId: string, variants: Omit<ItemVariant, "itemId">[]): void {
  db.variants = db.variants.filter((v) => v.itemId !== itemId);
  variants.forEach((v, i) => {
    db.variants.push({ ...v, id: v.id || generateId("var"), itemId, sortOrder: i });
  });
}

export function replaceItemAddonGroups(
  itemId: string,
  groups: (Omit<ItemAddonGroup, "itemId"> & { addons: Omit<ItemAddon, "groupId">[] })[],
): void {
  const existingGroupIds = db.addonGroups.filter((g) => g.itemId === itemId).map((g) => g.id);
  db.addons = db.addons.filter((a) => !existingGroupIds.includes(a.groupId));
  db.addonGroups = db.addonGroups.filter((g) => g.itemId !== itemId);

  groups.forEach((group, i) => {
    const groupId = group.id || generateId("grp");
    const { addons, ...rest } = group;
    db.addonGroups.push({ ...rest, id: groupId, itemId, sortOrder: i });
    addons.forEach((addon) => {
      db.addons.push({ ...addon, id: addon.id || generateId("add"), groupId });
    });
  });
}
