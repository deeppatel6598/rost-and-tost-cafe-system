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
 * The canteen's wall clock.
 *
 * Opening hours are what the staff painted on the shutter — they are local
 * campus time, not the server's. Hosting runs in UTC, so reading
 * `now.getHours()` made an 11:30am IST lunch rush look like 06:00 and closed
 * every stall in the canteen. Hours are therefore always evaluated in the
 * canteen's own timezone.
 */
const CANTEEN_TIMEZONE = process.env.CANTEEN_TIMEZONE || "Asia/Kolkata";

function minutesNowInCanteenTz(now: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: CANTEEN_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    const minute = Number(parts.find((p) => p.type === "minute")?.value);
    if (Number.isFinite(hour) && Number.isFinite(minute)) return hour * 60 + minute;
  } catch {
    // An unknown timezone id shouldn't take the canteen down; fall back below.
  }
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Whether a guest may order from this stall right now, and what to show them
 * if not.
 *
 * `serviceMode` is the staff's manual control and it genuinely overrides the
 * schedule in both directions — "open" keeps a stall serving past its posted
 * closing time, "closed" shuts it early. Only "scheduled" consults the hours.
 * A paused stall is "open but not taking orders just now", which reads
 * differently to a student than a closed one.
 */
export function getAvailability(stall: Stall, now: Date = new Date()): StallAvailability {
  if (stall.serviceMode === "closed") {
    return { canOrder: false, reason: "closed", label: "Closed" };
  }
  if (stall.isPaused) {
    return { canOrder: false, reason: "paused", label: "Not accepting orders right now" };
  }
  if (stall.serviceMode === "open") {
    return { canOrder: true, reason: "open", label: "Open now" };
  }

  const nowMinutes = minutesNowInCanteenTz(now);
  const opens = minutesOfDay(stall.opensAt, 0);
  const closes = minutesOfDay(stall.closesAt, 24 * 60);

  // A window where closing is "earlier" than opening runs past midnight.
  const withinHours =
    opens <= closes
      ? nowMinutes >= opens && nowMinutes < closes
      : nowMinutes >= opens || nowMinutes < closes;

  if (withinHours) {
    return { canOrder: true, reason: "open", label: `Open until ${formatClockLabel(stall.closesAt)}` };
  }
  return {
    canOrder: false,
    reason: "outside_hours",
    label: `Opens at ${formatClockLabel(stall.opensAt)}`,
  };
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
