import { db } from "@/lib/store/db";
import { definedOnly } from "@/lib/store/patch";
import type { Stall, StallAvailability, StallView } from "@/lib/types";

/**
 * Hours are stored as "HH:MM" strings. These two tolerate a missing or
 * malformed value rather than throwing: this code runs while rendering the
 * first screen a student sees after scanning, and one bad field should show a
 * wrong badge, not a server error page for the whole canteen.
 */
function minutesOfDay(hhmm: string | undefined, fallback: number): number {
  if (typeof hhmm !== "string") return fallback;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return fallback;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

function formatClockLabel(hhmm: string | undefined): string {
  if (typeof hhmm !== "string" || !hhmm.includes(":")) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Whether a guest may order from this stall right now, and what to show them
 * if not. Manual close beats the schedule; a paused stall is "open but not
 * taking orders", which reads differently to a student than "closed".
 */
export function getAvailability(stall: Stall, now: Date = new Date()): StallAvailability {
  if (!stall.isOpen) {
    return { canOrder: false, reason: "closed", label: "Closed" };
  }
  if (stall.isPaused) {
    return { canOrder: false, reason: "paused", label: "Not accepting orders right now" };
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const opens = minutesOfDay(stall.opensAt, 0);
  const closes = minutesOfDay(stall.closesAt, 24 * 60);

  if (nowMinutes < opens) {
    return { canOrder: false, reason: "outside_hours", label: `Opens at ${formatClockLabel(stall.opensAt)}` };
  }
  if (nowMinutes >= closes) {
    return { canOrder: false, reason: "outside_hours", label: `Closed · opens ${formatClockLabel(stall.opensAt)}` };
  }

  return { canOrder: true, reason: "open", label: `Open until ${formatClockLabel(stall.closesAt)}` };
}

export function toStallView(stall: Stall, now?: Date): StallView {
  return { ...stall, availability: getAvailability(stall, now) };
}

export function listStalls(): Stall[] {
  return [...db.stalls].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listStallViews(now?: Date): StallView[] {
  return listStalls().map((s) => toStallView(s, now));
}

export function getStall(id: string): Stall | undefined {
  return db.stalls.find((s) => s.id === id);
}

export function updateStall(id: string, patch: Partial<Stall>): Stall | undefined {
  const idx = db.stalls.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  // id and tokenSeq are never client-settable. definedOnly keeps a partial
  // patch from blanking fields the caller simply didn't mention.
  const { id: _ignoredId, tokenSeq: _ignoredSeq, ...safe } = patch;
  db.stalls[idx] = { ...db.stalls[idx], ...definedOnly(safe) };
  return db.stalls[idx];
}

/** Allocates the next called-out token for a stall, e.g. LP-042. */
export function nextTokenNumber(stallId: string): string {
  const stall = db.stalls.find((s) => s.id === stallId);
  if (!stall) throw new Error(`Unknown stall: ${stallId}`);
  stall.tokenSeq += 1;
  return `${stall.tokenPrefix}-${String(stall.tokenSeq).padStart(3, "0")}`;
}
