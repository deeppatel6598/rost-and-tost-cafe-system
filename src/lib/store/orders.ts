import { generateId, generatePublicToken } from "@/lib/format";
import { CANCEL_WINDOW_MS } from "@/lib/order-constants";
import { priceCart, PricingError } from "@/lib/pricing";
import { db } from "@/lib/store/db";
import { getAvailability, nextTokenNumber } from "@/lib/store/stalls";
import type {
  CartLineInput,
  Order,
  PaymentMethod,
  PaymentStatus,
  SubOrder,
  SubOrderItem,
  SubOrderStatus,
  SubOrderView,
} from "@/lib/types";

export class OrderError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 422,
  ) {
    super(message);
  }
}

export { CANCEL_WINDOW_MS };

const FORWARD: Record<SubOrderStatus, SubOrderStatus | null> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};

/* ── Reads ───────────────────────────────────────────────────────────────── */

function itemsFor(subOrderId: string): SubOrderItem[] {
  return db.subOrderItems.filter((i) => i.subOrderId === subOrderId);
}

export function toView(sub: SubOrder): SubOrderView {
  const order = db.orders.find((o) => o.id === sub.orderId);
  const stall = db.stalls.find((s) => s.id === sub.stallId);
  const table = db.tables.find((t) => t.id === order?.tableId);
  return {
    ...sub,
    items: itemsFor(sub.id),
    stallName: stall?.name ?? "Unknown stall",
    stallTokenPrefix: stall?.tokenPrefix ?? "",
    tableNumber: table?.tableNumber ?? 0,
    publicToken: order?.publicToken ?? "",
    guestPhone: order?.guestPhone,
  };
}

export function getOrderByPublicToken(publicToken: string): Order | undefined {
  return db.orders.find((o) => o.publicToken === publicToken);
}

/** Every sub-order under one public token (a table session's basket of orders). */
export function getSubOrdersByPublicToken(publicToken: string): SubOrderView[] {
  const order = getOrderByPublicToken(publicToken);
  if (!order) return [];
  return db.subOrders
    .filter((s) => s.orderId === order.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(toView);
}

export function getSubOrder(id: string): SubOrder | undefined {
  return db.subOrders.find((s) => s.id === id);
}

/**
 * Reads scoped to one stall. Every admin query goes through here with the
 * authenticated user's stallId, so a staff account cannot read another
 * stall's orders by changing an id in a URL.
 */
export function listSubOrdersForStall(stallId: string): SubOrderView[] {
  return db.subOrders
    .filter((s) => s.stallId === stallId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(toView);
}

export function getSubOrderForStall(stallId: string, subOrderId: string): SubOrderView | undefined {
  const sub = db.subOrders.find((s) => s.id === subOrderId && s.stallId === stallId);
  return sub ? toView(sub) : undefined;
}

export function listAllSubOrders(): SubOrderView[] {
  return [...db.subOrders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map(toView);
}

/* ── Order creation ──────────────────────────────────────────────────────── */

export interface CreateOrderArgs {
  tableId: string;
  stallId: string;
  lines: CartLineInput[];
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  guestPhone?: string;
  idempotencyKey: string;
  /** Optional client-computed total, checked for disagreement only. */
  expectedTotal?: number;
}

export interface CreateOrderResult {
  order: Order;
  subOrder: SubOrderView;
  /** True when this call replayed an existing order rather than creating one. */
  replayed: boolean;
}

/**
 * Creates one order with exactly one sub-order.
 *
 * The order → sub_order split exists even though there is always one
 * sub-order today: it is what lets a future release put two stalls under one
 * order without a schema rewrite. Today, ordering from a second stall creates
 * a second order with its own token, because each stall settles its own money.
 *
 * This whole function is synchronous on purpose. Node runs one JS thread, so
 * nothing interleaves between the availability check and the write — that is
 * what makes the idempotency lookup and the sold-out check atomic here. On a
 * real database both must move inside one transaction, with the sold-out
 * check done as a conditional update rather than a read-then-write.
 */
export function createOrder(args: CreateOrderArgs): CreateOrderResult {
  // Idempotency first: a double-tap, or an offline retry of a request that
  // actually succeeded, must return the original order rather than a second one.
  const existingOrderId = db.idempotency.get(args.idempotencyKey);
  if (existingOrderId) {
    const order = db.orders.find((o) => o.id === existingOrderId);
    const sub = db.subOrders.find((s) => s.orderId === existingOrderId);
    if (order && sub) {
      return { order, subOrder: toView(sub), replayed: true };
    }
  }

  const table = db.tables.find((t) => t.id === args.tableId);
  if (!table || !table.isActive) {
    throw new OrderError("That table is not taking orders.", "invalid_table", 400);
  }

  const stall = db.stalls.find((s) => s.id === args.stallId);
  if (!stall) {
    throw new OrderError("That stall does not exist.", "unknown_stall", 404);
  }

  const availability = getAvailability(stall);
  if (!availability.canOrder) {
    throw new OrderError(`${stall.name} is not taking orders right now.`, "stall_closed", 409);
  }

  if (args.paymentMethod === "cash" && !stall.acceptsCash) {
    throw new OrderError(`${stall.name} is not accepting cash right now.`, "method_unavailable", 409);
  }
  if (args.paymentMethod === "upi" && !stall.acceptsUpi) {
    throw new OrderError(`${stall.name} is not accepting UPI right now.`, "method_unavailable", 409);
  }

  let priced;
  try {
    priced = priceCart(stall, args.lines);
  } catch (err) {
    if (err instanceof PricingError) {
      throw new OrderError(err.message, err.code, err.code === "item_unavailable" ? 409 : 422);
    }
    throw err;
  }

  // The client's total is only ever a disagreement check. The server's number
  // is the one that gets charged; a mismatch means the menu changed under the
  // guest (or someone is editing the request), so stop and make them re-read.
  if (typeof args.expectedTotal === "number" && Math.round(args.expectedTotal) !== priced.total) {
    throw new OrderError(
      "Prices changed while you were ordering. Please review your cart and try again.",
      "total_mismatch",
      409,
    );
  }

  // Sold-out race: re-read availability immediately before writing, inside the
  // same synchronous block as the write below, so two students racing for the
  // last plate cannot both pass. (DB port: SELECT ... FOR UPDATE, or an
  // UPDATE ... WHERE is_available = true guard.)
  for (const line of priced.lines) {
    const item = db.items.find((i) => i.id === line.itemId);
    if (!item || !item.isActive || !item.isAvailable) {
      throw new OrderError(`${line.itemNameSnapshot} just sold out.`, "item_unavailable", 409);
    }
    if (line.variantId && !db.variants.find((v) => v.id === line.variantId)?.isAvailable) {
      throw new OrderError(`${line.itemNameSnapshot} just sold out.`, "variant_unavailable", 409);
    }
  }

  const now = new Date().toISOString();

  const order: Order = {
    id: generateId("ord"),
    publicToken: generatePublicToken(),
    tableId: table.id,
    fulfillmentType: "dine_in",
    createdAt: now,
    guestPhone: args.guestPhone,
  };

  const subOrder: SubOrder = {
    id: generateId("sub"),
    orderId: order.id,
    stallId: stall.id,
    tokenNumber: nextTokenNumber(stall.id),
    status: "PLACED",
    paymentMethod: args.paymentMethod,
    paymentStatus: "PENDING",
    subtotal: priced.subtotal,
    taxAmount: priced.taxAmount,
    total: priced.total,
    specialInstructions: args.specialInstructions?.slice(0, 120),
    createdAt: now,
  };

  const subItems: SubOrderItem[] = priced.lines.map((line) => ({
    id: generateId("soi"),
    subOrderId: subOrder.id,
    itemId: line.itemId,
    variantId: line.variantId,
    itemNameSnapshot: line.itemNameSnapshot,
    variantNameSnapshot: line.variantNameSnapshot,
    unitPriceSnapshot: line.unitPriceSnapshot,
    quantity: line.quantity,
    addonsSnapshot: line.addonsSnapshot,
    lineTotal: line.lineTotal,
  }));

  db.orders.push(order);
  db.subOrders.push(subOrder);
  db.subOrderItems.push(...subItems);
  db.idempotency.set(args.idempotencyKey, order.id);

  return { order, subOrder: toView(subOrder), replayed: false };
}

/* ── State machine ───────────────────────────────────────────────────────── */

/** Why a sub-order can't advance right now, or null if it can. */
export function blockedReason(sub: SubOrder): string | null {
  if (sub.status === "CANCELLED") return "This order was cancelled.";
  if (sub.status === "COMPLETED") return "This order is already complete.";

  // A UPI order is a claim until staff verify it in their own UPI app. Do not
  // let anyone start cooking against an unverified claim.
  if (sub.paymentMethod === "upi" && sub.status === "PLACED" && sub.paymentStatus !== "CONFIRMED") {
    return "Confirm the UPI payment before starting this order.";
  }
  return null;
}

export function advanceStatus(stallId: string, subOrderId: string): SubOrderView {
  const sub = db.subOrders.find((s) => s.id === subOrderId && s.stallId === stallId);
  if (!sub) throw new OrderError("Order not found.", "not_found", 404);

  const blocked = blockedReason(sub);
  if (blocked) throw new OrderError(blocked, "transition_blocked", 409);

  const next = FORWARD[sub.status];
  if (!next) throw new OrderError("This order cannot move any further.", "transition_blocked", 409);

  const now = new Date().toISOString();

  if (next === "COMPLETED") {
    // COMPLETED means the student has the food and the stall has the money.
    // For cash that is the moment of collection, so confirm payment here.
    if (sub.paymentMethod === "cash" && sub.paymentStatus === "PENDING") {
      sub.paymentStatus = "CONFIRMED";
      sub.paidConfirmedAt = now;
    }
    if (sub.paymentStatus !== "CONFIRMED") {
      throw new OrderError("Payment is not confirmed for this order yet.", "payment_unconfirmed", 409);
    }
    sub.completedAt = now;
  }

  if (next === "ACCEPTED") sub.acceptedAt = now;
  if (next === "READY") sub.readyAt = now;

  sub.status = next;
  return toView(sub);
}

export function cancelByStall(stallId: string, subOrderId: string, reason: string): SubOrderView {
  const sub = db.subOrders.find((s) => s.id === subOrderId && s.stallId === stallId);
  if (!sub) throw new OrderError("Order not found.", "not_found", 404);
  if (sub.status !== "PLACED" && sub.status !== "ACCEPTED") {
    throw new OrderError("Only a new or accepted order can be rejected.", "transition_blocked", 409);
  }

  const now = new Date().toISOString();
  sub.status = "CANCELLED";
  sub.cancelReason = reason;
  sub.cancelledAt = now;

  // Money already taken has to come back. Surface it rather than silently
  // leaving the student out of pocket.
  if (sub.paymentStatus === "CONFIRMED") {
    sub.paymentStatus = "REFUND_DUE";
  }
  return toView(sub);
}

export function cancelByGuest(publicToken: string, subOrderId: string): SubOrderView {
  const order = getOrderByPublicToken(publicToken);
  if (!order) throw new OrderError("Order not found.", "not_found", 404);

  const sub = db.subOrders.find((s) => s.id === subOrderId && s.orderId === order.id);
  if (!sub) throw new OrderError("Order not found.", "not_found", 404);

  if (sub.status !== "PLACED") {
    throw new OrderError(
      "The stall has already started this order. Please ask staff for help.",
      "too_late",
      409,
    );
  }
  if (Date.now() - new Date(sub.createdAt).getTime() > CANCEL_WINDOW_MS) {
    throw new OrderError(
      "The cancellation window has passed. Please ask staff for help.",
      "too_late",
      409,
    );
  }

  const now = new Date().toISOString();
  sub.status = "CANCELLED";
  sub.cancelReason = "Cancelled by guest";
  sub.cancelledAt = now;
  if (sub.paymentStatus === "CONFIRMED") sub.paymentStatus = "REFUND_DUE";
  return toView(sub);
}

/* ── Payments ────────────────────────────────────────────────────────────── */

/** Guest tapped "I have paid" on a UPI order. A claim, not a confirmation. */
export function markUpiClaimed(publicToken: string, subOrderId: string, reference?: string): SubOrderView {
  const order = getOrderByPublicToken(publicToken);
  if (!order) throw new OrderError("Order not found.", "not_found", 404);

  const sub = db.subOrders.find((s) => s.id === subOrderId && s.orderId === order.id);
  if (!sub) throw new OrderError("Order not found.", "not_found", 404);
  if (sub.paymentMethod !== "upi") {
    throw new OrderError("That order is not a UPI order.", "not_upi", 409);
  }
  if (sub.paymentStatus === "CONFIRMED") return toView(sub);

  sub.paymentStatus = "AWAITING_CONFIRMATION";
  if (reference) sub.upiReference = reference.slice(0, 40);
  return toView(sub);
}

export function setPaymentStatus(
  stallId: string,
  subOrderId: string,
  paymentStatus: PaymentStatus,
  actorId: string,
): SubOrderView {
  const sub = db.subOrders.find((s) => s.id === subOrderId && s.stallId === stallId);
  if (!sub) throw new OrderError("Order not found.", "not_found", 404);

  const now = new Date().toISOString();
  sub.paymentStatus = paymentStatus;

  if (paymentStatus === "CONFIRMED") {
    sub.paidConfirmedBy = actorId;
    sub.paidConfirmedAt = now;
  }
  if (paymentStatus === "REFUNDED") {
    sub.refundedAt = now;
  }
  return toView(sub);
}

/* ── Reporting ───────────────────────────────────────────────────────────── */

export interface TodayStats {
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
  grossSales: number;
  cashSales: number;
  upiSales: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  hourly: { hour: number; count: number }[];
}

function isSameDay(iso: string, day: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate()
  );
}

/**
 * Today's numbers for one stall, or the whole canteen when stallId is null.
 * Sales count only money actually confirmed — an unpaid or cancelled order
 * is not revenue, and a stall owner checking their day would spot it if it were.
 */
export function todayStats(stallId: string | null, day: Date = new Date()): TodayStats {
  const subs = db.subOrders.filter(
    (s) => (stallId === null || s.stallId === stallId) && isSameDay(s.createdAt, day),
  );

  const paid = subs.filter((s) => s.paymentStatus === "CONFIRMED" && s.status !== "CANCELLED");
  const grossSales = paid.reduce((sum, s) => sum + s.total, 0);

  const itemTotals = new Map<string, { quantity: number; revenue: number }>();
  for (const sub of paid) {
    for (const line of itemsFor(sub.id)) {
      const entry = itemTotals.get(line.itemNameSnapshot) ?? { quantity: 0, revenue: 0 };
      entry.quantity += line.quantity;
      entry.revenue += line.lineTotal;
      itemTotals.set(line.itemNameSnapshot, entry);
    }
  }

  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: subs.filter((s) => new Date(s.createdAt).getHours() === hour).length,
  }));

  return {
    orderCount: subs.length,
    completedCount: subs.filter((s) => s.status === "COMPLETED").length,
    cancelledCount: subs.filter((s) => s.status === "CANCELLED").length,
    grossSales,
    cashSales: paid.filter((s) => s.paymentMethod === "cash").reduce((sum, s) => sum + s.total, 0),
    upiSales: paid.filter((s) => s.paymentMethod === "upi").reduce((sum, s) => sum + s.total, 0),
    topItems: Array.from(itemTotals.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    hourly,
  };
}

/** Orders needing human attention: failed payments and refunds owed. */
export function listProblemOrders(stallId: string | null): SubOrderView[] {
  return db.subOrders
    .filter(
      (s) =>
        (stallId === null || s.stallId === stallId) &&
        (s.paymentStatus === "FAILED" || s.paymentStatus === "REFUND_DUE"),
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(toView);
}
