import { fields, sql, type Db } from "@/lib/db/sql";
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

export async function listStalls(): Promise<Stall[]> {
  return sql<Stall[]>`select * from stalls order by sort_order`;
}

export async function listStallViews(now?: Date): Promise<StallView[]> {
  const stalls = await listStalls();
  return stalls.map((s) => toStallView(s, now));
}

export async function getStall(id: string): Promise<Stall | undefined> {
  const [row] = await sql<Stall[]>`select * from stalls where id = ${id}`;
  return row;
}

export async function updateStall(id: string, patch: Partial<Stall>): Promise<Stall | undefined> {
  // id and tokenSeq are never client-settable. definedOnly keeps a partial
  // patch from blanking fields the caller simply didn't mention — spreading
  // an explicit `undefined` over a stored row is how toggling "accept cash"
  // once wiped a stall's opening hours.
  const { id: _ignoredId, tokenSeq: _ignoredSeq, ...rest } = patch;
  const safe = definedOnly(rest);
  if (Object.keys(safe).length === 0) return getStall(id);

  const [row] = await sql<Stall[]>`
    update stalls set ${sql(fields(safe))} where id = ${id} returning *
  `;
  return row;
}

/**
 * Allocates the next called-out token for a stall, e.g. LP-042.
 *
 * The increment and the read are one statement, so two students checking out
 * at the same instant cannot be handed the same number. Pass the transaction
 * handle when calling this inside one, or the token would be allocated on a
 * separate connection and survive a rolled-back order.
 */
export async function nextTokenNumber(stallId: string, tx: Db = sql): Promise<string> {
  const [row] = await tx<{ tokenPrefix: string; tokenSeq: number }[]>`
    update stalls set token_seq = token_seq + 1
    where id = ${stallId}
    returning token_prefix, token_seq
  `;
  if (!row) throw new Error(`Unknown stall: ${stallId}`);
  return `${row.tokenPrefix}-${String(row.tokenSeq).padStart(3, "0")}`;
}
