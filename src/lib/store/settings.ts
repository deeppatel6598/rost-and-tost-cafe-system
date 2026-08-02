import { db } from "@/lib/store/db";
import type { CafeSettings } from "@/lib/types";

export function getSettings(): CafeSettings {
  return { ...db.settings };
}

export function updateSettings(patch: Partial<CafeSettings>): CafeSettings {
  db.settings = { ...db.settings, ...patch };
  return { ...db.settings };
}
