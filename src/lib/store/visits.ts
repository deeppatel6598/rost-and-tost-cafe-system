import { generateId } from "@/lib/format";
import { normalisePhone } from "@/lib/phone";
import { db } from "@/lib/store/db";
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

export function isCurrent(visit: Visit | undefined, now = Date.now()): visit is Visit {
  if (!visit) return false;
  if (visit.closedAt) return false;
  return now - new Date(visit.lastActivityAt).getTime() < VISIT_WINDOW_MS;
}

export function getVisit(id: string | undefined): Visit | undefined {
  if (!id) return undefined;
  return db.visits.find((v) => v.id === id);
}

/** The cookie's visit, but only if it is still usable for this table. */
export function getCurrentVisitForTable(visitId: string | undefined, tableId: string): Visit | undefined {
  const visit = getVisit(visitId);
  if (!isCurrent(visit)) return undefined;
  return visit.tableId === tableId ? visit : undefined;
}

export function openVisit(tableId: string): Visit {
  const now = new Date().toISOString();
  const visit: Visit = {
    id: generateId("visit"),
    tableId,
    openedAt: now,
    lastActivityAt: now,
  };
  db.visits.push(visit);
  return visit;
}

export function touchVisit(id: string): void {
  const visit = getVisit(id);
  if (visit && !visit.closedAt) visit.lastActivityAt = new Date().toISOString();
}

export function endVisit(id: string, reason: VisitCloseReason): void {
  const visit = getVisit(id);
  if (!visit || visit.closedAt) return;
  visit.closedAt = new Date().toISOString();
  visit.closedReason = reason;
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
 */
export function currentVisitsByPhone(phone: string): Visit[] {
  const wanted = normalisePhone(phone);
  if (!wanted) return [];
  const now = Date.now();
  return db.visits
    .filter((v) => v.guestPhone === wanted && isCurrent(v, now))
    .sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1));
}

/** Manual recovery is deliberately narrower: this table only. */
export function findCurrentVisitAtTable(tableId: string, phone: string): Visit | undefined {
  return currentVisitsByPhone(phone).find((v) => v.tableId === tableId);
}

/**
 * Decides which visit an order belongs to, given the number at checkout.
 *
 * Every stamp/supersede decision lives here so there is exactly one place to
 * read when asking "why did this order land on that visit?".
 */
export function claimVisit(visitId: string, phone: string): Visit {
  const wanted = normalisePhone(phone);
  const visit = getVisit(visitId);
  if (!visit) throw new Error(`claimVisit: unknown visit ${visitId}`);

  // First checkout of this sitting — the number claims it.
  if (!visit.guestPhone) {
    visit.guestPhone = wanted;
    visit.lastActivityAt = new Date().toISOString();
    return visit;
  }

  if (visit.guestPhone === wanted) {
    visit.lastActivityAt = new Date().toISOString();
    return visit;
  }

  // A different number on the same device is a different guest. Retire this
  // sitting and start a fresh one, so the previous person's orders drop out of
  // the list the moment someone else orders.
  endVisit(visit.id, "superseded");
  const next = openVisit(visit.tableId);
  next.guestPhone = wanted;
  return next;
}
