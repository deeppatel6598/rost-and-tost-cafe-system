import { generateId } from "@/lib/format";
import { normalisePhone } from "@/lib/phone";
import { sql, type Db } from "@/lib/db/sql";
import type { Visit, VisitCloseReason } from "@/lib/types";

/**
 * Visits — who is actually ordering.
 *
 * The rule, in one sentence: **the phone number is the identity, the table
 * scopes who may claim it, and the cookie is only a fast path.**
 *
 * That is what separates two students at one table without a timer and without
 * asking staff to press anything. Student A orders with her number; student B
 * sits down later, orders with his, and the app treats that as a different
 * guest from his first checkout onwards.
 *
 * A visit is "current" when it has not been explicitly ended and has seen
 * activity inside VISIT_WINDOW_MS. Currency is computed in the query rather
 * than swept by a cron — there is no background job in this app and adding one
 * to expire rows would be machinery for its own sake.
 */

/** Matches the session cookie's TTL: a visit lasts a meal, not a day. */
export const VISIT_WINDOW_MS = 4 * 60 * 60 * 1000;

/** SQL fragment for "still current", used by every lookup below. */
const CURRENT = sql`closed_at is null and last_activity_at > now() - interval '4 hours'`;

export function isCurrent(visit: Visit | undefined, now = Date.now()): visit is Visit {
  if (!visit) return false;
  if (visit.closedAt) return false;
  return now - new Date(visit.lastActivityAt).getTime() < VISIT_WINDOW_MS;
}

export async function getVisit(id: string | undefined, tx: Db = sql): Promise<Visit | undefined> {
  if (!id) return undefined;
  const [row] = await tx<Visit[]>`select * from visits where id = ${id}`;
  return row;
}

/** The cookie's visit, but only if it is still usable for this table. */
export async function getCurrentVisitForTable(
  visitId: string | undefined,
  tableId: string,
): Promise<Visit | undefined> {
  if (!visitId) return undefined;
  const [row] = await sql<Visit[]>`
    select * from visits
    where id = ${visitId} and table_id = ${tableId} and ${CURRENT}
  `;
  return row;
}

export async function openVisit(tableId: string, tx: Db = sql): Promise<Visit> {
  const [row] = await tx<Visit[]>`
    insert into visits (id, table_id) values (${generateId("visit")}, ${tableId})
    returning *
  `;
  return row;
}

export async function touchVisit(id: string, tx: Db = sql): Promise<void> {
  await tx`update visits set last_activity_at = now() where id = ${id} and closed_at is null`;
}

export async function endVisit(id: string, reason: VisitCloseReason, tx: Db = sql): Promise<void> {
  await tx`
    update visits set closed_at = now(), closed_reason = ${reason}
    where id = ${id} and closed_at is null
  `;
}

/**
 * Every current visit carrying this number, newest first.
 *
 * This is what makes the order list follow the *person* rather than the table.
 * Food is collected at the counter when a token is called, so the table
 * identifies the student — it is not a delivery address, and a student who
 * moves from table 7 to table 12 must not lose their orders. Because this
 * query spans tables, two visits with one number are already one person and
 * nothing ever has to be merged.
 *
 * Callers must have established that the caller is entitled to the number —
 * see visitsVisibleTo, which is what every guest-facing path actually uses.
 */
export async function currentVisitsByPhone(phone: string): Promise<Visit[]> {
  const wanted = normalisePhone(phone);
  if (!wanted) return [];
  return sql<Visit[]>`
    select * from visits
    where guest_phone = ${wanted} and ${CURRENT}
    order by last_activity_at desc
  `;
}

/**
 * The sittings this browser is allowed to see for a number.
 *
 * Two ways to qualify, and the first is why most students never meet a code
 * at all:
 *
 *  1. **This browser opened the sitting.** It placed the order; it can see it.
 *     A student moving between tables on one phone stays whole, with no SMS
 *     and no waiting.
 *  2. **This browser has verified the number.** Needed for a second phone, a
 *     cleared browser — or someone who typed a number that is not theirs,
 *     which is the case this whole feature exists to stop.
 */
export async function visitsVisibleTo(
  phone: string,
  deviceHash: string | undefined,
  verified: boolean,
): Promise<Visit[]> {
  const wanted = normalisePhone(phone);
  if (!wanted) return [];
  if (verified) return currentVisitsByPhone(wanted);
  if (!deviceHash) return [];
  return sql<Visit[]>`
    select * from visits
    where guest_phone = ${wanted} and device_hash = ${deviceHash} and ${CURRENT}
    order by last_activity_at desc
  `;
}

/** Manual recovery is deliberately narrower: this table only. */
export async function findCurrentVisitAtTable(
  tableId: string,
  phone: string,
): Promise<Visit | undefined> {
  const wanted = normalisePhone(phone);
  if (!wanted) return undefined;
  const [row] = await sql<Visit[]>`
    select * from visits
    where guest_phone = ${wanted} and table_id = ${tableId} and ${CURRENT}
    order by last_activity_at desc
    limit 1
  `;
  return row;
}

/**
 * Decides which visit an order belongs to, given the number at checkout.
 *
 * Every stamp/supersede decision lives here so there is exactly one place to
 * read when asking "why did this order land on that visit?". Runs inside the
 * order's transaction, so superseding a sitting and writing the order either
 * both happen or neither does.
 */
export async function claimVisit(
  visitId: string,
  phone: string,
  deviceHash: string | undefined,
  tx: Db = sql,
): Promise<Visit> {
  const wanted = normalisePhone(phone);
  const visit = await getVisit(visitId, tx);
  if (!visit) throw new Error(`claimVisit: unknown visit ${visitId}`);

  // First checkout of this sitting — the number claims it, and the browser
  // that placed the order is recorded so it can keep seeing it later.
  if (!visit.guestPhone) {
    const [row] = await tx<Visit[]>`
      update visits
      set guest_phone = ${wanted},
          device_hash = coalesce(${deviceHash ?? null}, device_hash),
          last_activity_at = now()
      where id = ${visit.id}
      returning *
    `;
    return row;
  }

  if (visit.guestPhone === wanted) {
    const [row] = await tx<Visit[]>`
      update visits
      set last_activity_at = now(),
          device_hash = coalesce(device_hash, ${deviceHash ?? null})
      where id = ${visit.id}
      returning *
    `;
    return row;
  }

  // A different number on the same device is a different guest. Retire this
  // sitting and start a fresh one, so the previous person's orders drop out of
  // the list the moment someone else orders.
  await endVisit(visit.id, "superseded", tx);
  const [row] = await tx<Visit[]>`
    insert into visits (id, table_id, guest_phone, device_hash)
    values (${generateId("visit")}, ${visit.tableId}, ${wanted}, ${deviceHash ?? null})
    returning *
  `;
  return row;
}
