import { generateId } from "@/lib/format";
import { db } from "@/lib/store/db";
import type { MenuItem } from "@/lib/types";

export function listMenuItems(): MenuItem[] {
  return [...db.menuItems];
}

export function getMenuItem(id: string): MenuItem | undefined {
  return db.menuItems.find((m) => m.id === id);
}

export type CreateMenuItemInput = Omit<MenuItem, "id" | "createdAt" | "updatedAt">;

export function createMenuItem(input: CreateMenuItemInput): MenuItem {
  const now = new Date().toISOString();
  const newItem: MenuItem = {
    ...input,
    id: generateId("item"),
    createdAt: now,
    updatedAt: now,
  };
  db.menuItems.push(newItem);
  return newItem;
}

export type UpdateMenuItemInput = Partial<Omit<MenuItem, "id" | "createdAt" | "updatedAt">>;

export function updateMenuItem(id: string, patch: UpdateMenuItemInput): MenuItem | undefined {
  const idx = db.menuItems.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;
  const updated: MenuItem = {
    ...db.menuItems[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  db.menuItems[idx] = updated;
  return updated;
}

export function deleteMenuItem(id: string): boolean {
  const idx = db.menuItems.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  db.menuItems.splice(idx, 1);
  return true;
}

export function setMenuItemAvailability(id: string, available: boolean): MenuItem | undefined {
  return updateMenuItem(id, { available });
}
