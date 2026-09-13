import { generateId, generatePublicToken } from "@/lib/format";
import { CANCEL_WINDOW_MS } from "@/lib/order-constants";
import { PHONE_HELP, isValidPhone, normalisePhone } from "@/lib/phone";
import { priceCart, PricingError } from "@/lib/pricing";
import { sql, type Db } from "@/lib/db/sql";
import { loadCatalogue } from "@/lib/store/menu";
import { getAvailability, nextTokenNumber } from "@/lib/store/stalls";
import { claimVisit, currentVisitsByPhone, getVisit } from "@/lib/store/visits";
import type { DiningTable, Stall } from "@/lib/types";
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

/**
 * Hydrates sub-orders into the shape every screen renders.
 *
 * Takes a list rather than one row so a queue of forty orders costs three
 * queries instead of a hundred and twenty. The joined columns are aliased so
 * transform.camel maps them onto the view's own field names.
 */
async function toViews(subs: SubOrder[], tx: Db = sql): Promise<SubOrderView[]> {
  if (subs.length === 0) return [];
  const subIds = subs.map((s) => s.id);
  const orderIds = [...new Set(subs.map((s) => s.orderId))];

  const [lines, orders] = await Promise.all([
    tx<SubOrderItem[]>`select * from sub_order_items where sub_order_id in ${tx(subIds)}`,
    tx<{ id: string; publicToken: string; guestPhone?: string; tableNumber: number }[]>`
      select o.id, o.public_token, o.guest_phone, t.table_number
      from orders o join dining_tables t on t.id = o.table_id
      where o.id in ${tx(orderIds)}
    `,
  ]);
  const stalls = await tx<{ id: string; name: string; tokenPrefix: string }[]>`
    select id, name, token_prefix from stalls where id in ${tx([...new Set(subs.map((s) => s.stallId))])}
  `;

  const linesBySub = new Map<string, SubOrderItem[]>();
  for (const line of lines) {
    linesBySub.set(line.subOrderId, [...(linesBySub.get(line.subOrderId) ?? []), line]);
  }
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const stallById = new Map(stalls.map((s) => [s.id, s]));

  return subs.map((sub) => {
    const order = orderById.get(sub.orderId);
    const stall = stallById.get(sub.stallId);
    return {
      ...sub,
      items: linesBySub.get(sub.id) ?? [],
      stallName: stall?.name ?? "Unknown stall",
      stallTokenPrefix: stall?.tokenPrefix ?? "",
      tableNumber: order?.tableNumber ?? 0,
      publicToken: order?.publicToken ?? "",
      guestPhone: order?.guestPhone,
    };
  });
}

async function toView(sub: SubOrder, tx: Db = sql): Promise<SubOrderView> {
  const [view] = await toViews([sub], tx);
  return view;
}

export async function getOrderByPublicToken(publicToken: string): Promise<Order | undefined> {
  const [row] = await sql<Order[]>`select * from orders where public_token = ${publicToken}`;
  return row;
}

/** Every sub-order under one public token — that is, one checkout. */
export async function getSubOrdersByPublicToken(publicToken: string): Promise<SubOrderView[]> {
  const subs = await sql<SubOrder[]>`
    select s.* from sub_orders s
    join orders o on o.id = s.order_id
    where o.public_token = ${publicToken}
    order by s.created_at desc
  `;
  return toViews(subs);
}

export async function getSubOrder(id: string): Promise<SubOrder | undefined> {
  const [row] = await sql<SubOrder[]>`select * from sub_orders where id = ${id}`;
  return row;
}

/**
 * Reads scoped to one stall. Every admin query goes through here with the
 * authenticated user's stallId, so a staff account cannot read another
 * stall's orders by changing an id in a URL.
 */
export async function listSubOrdersForStall(stallId: string): Promise<SubOrderView[]> {
  const subs = await sql<SubOrder[]>`
    select * from sub_orders where stall_id = ${stallId} order by created_at desc
  `;
  return toViews(subs);
}

export async function getSubOrderForStall(
  stallId: string,
  subOrderId: string,
): Promise<SubOrderView | undefined> {
  const [sub] = await sql<SubOrder[]>`
    select * from sub_orders where id = ${subOrderId} and stall_id = ${stallId}
  `;
  return sub ? toView(sub) : undefined;
}

export async function listAllSubOrders(): Promise<SubOrderView[]> {
  const subs = await sql<SubOrder[]>`select * from sub_orders order by created_at desc`;
  return toViews(subs);
}

/**
 * Every order belonging to a set of visits, newest first.
 *
 * Callers pass the visits that resolve to one person, so this is the query
 * behind "my orders" — it follows the student across tables and across a
 * closed browser tab.
 */
export async function listOrdersForVisits(visitIds: string[]): Promise<SubOrderView[]> {
  if (visitIds.length === 0) return [];
  const subs = await sql<SubOrder[]>`
    select s.* from sub_orders s
    join orders o on o.id = s.order_id
    where o.visit_id in ${sql(visitIds)}
    order by s.created_at desc
  `;
  return toViews(subs);
}

/**
 * The orders a session should see: everything from every current visit
 * carrying its phone number, or just this sitting before the first checkout.
 */
export async function listOrdersForSession(visitId: string | undefined): Promise<SubOrderView[]> {
  const visit = await getVisit(visitId);
  if (!visit) return [];
  if (!visit.guestPhone) return listOrdersForVisits([visit.id]);
  const visits = await currentVisitsByPhone(visit.guestPhone);
  return listOrdersForVisits(visits.map((v) => v.id));
}

/* ── Order creation ──────────────────────────────────────────────────────── */

export interface CreateOrderArgs {
  tableId: string;
  stallId: string;
  lines: CartLineInput[];
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  /** Required — a stall must be able to reach the student about their food. */
  guestPhone: string;
  /** The sitting this order is being placed during. */
  visitId: string;
  idempotencyKey: string;
  /** Optional client-computed total, checked for disagreement only. */
  expectedTotal?: number;
}

export interface CreateOrderResult {
  order: Order;
  /** The visit the order actually landed on — may differ from the one passed
   *  in, when a different phone number supersedes the sitting. */
  visitId: string;
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
 * Everything from the idempotency check to the write happens in ONE
 * transaction, which is what makes the guarantees real rather than incidental.
 * The in-memory version leaned on Node running a single thread; that stops
 * being true the moment there is more than one server process, which is
 * exactly what serverless hosting does.
 *
 * Three races are closed here:
 *
 *  - **Double-tap.** idempotency_keys has the key as its primary key, so a
 *    concurrent duplicate loses the insert and reads the winner's order.
 *  - **Sold out.** loadCatalogue takes `for update` on the item rows, so two
 *    students racing for the last plate serialise and the second sees the
 *    updated row.
 *  - **Token numbers.** nextTokenNumber increments and returns in one
 *    statement, inside this transaction, so two simultaneous orders cannot be
 *    handed the same number — and a rolled-back order does not burn one.
 */
export async function createOrder(args: CreateOrderArgs): Promise<CreateOrderResult> {
  if (!isValidPhone(args.guestPhone)) {
    throw new OrderError(PHONE_HELP, "phone_invalid", 400);
  }

  const replay = await findByIdempotencyKey(args.idempotencyKey);
  if (replay) return replay;

  try {
    return await sql.begin(async (tx) => {
      const [table] = await tx<DiningTable[]>`
        select * from dining_tables where id = ${args.tableId} and is_active
      `;
      if (!table) {
        throw new OrderError("That table is not taking orders.", "invalid_table", 400);
      }

      const [stall] = await tx<Stall[]>`select * from stalls where id = ${args.stallId}`;
      if (!stall) {
        throw new OrderError("That stall does not exist.", "unknown_stall", 404);
      }

      if (!getAvailability(stall).canOrder) {
        throw new OrderError(`${stall.name} is not taking orders right now.`, "stall_closed", 409);
      }
      if (args.paymentMethod === "cash" && !stall.acceptsCash) {
        throw new OrderError(`${stall.name} is not accepting cash right now.`, "method_unavailable", 409);
      }
      if (args.paymentMethod === "upi" && !stall.acceptsUpi) {
        throw new OrderError(`${stall.name} is not accepting UPI right now.`, "method_unavailable", 409);
      }

      // Locks the item rows, then prices against exactly those rows. Pricing
      // and the sold-out check therefore see one consistent snapshot — there
      // is no second read for a toggle to slip between.
      const catalogue = await loadCatalogue(
        (args.lines ?? []).map((l) => l.itemId),
        tx,
      );

      let priced;
      try {
        priced = priceCart(stall, args.lines, catalogue);
      } catch (err) {
        if (err instanceof PricingError) {
          throw new OrderError(err.message, err.code, err.code === "item_unavailable" ? 409 : 422);
        }
        throw err;
      }

      // The client's total is only ever a disagreement check. The server's
      // number is the one that gets charged; a mismatch means the menu changed
      // under the guest (or someone is editing the request), so stop and make
      // them re-read.
      if (typeof args.expectedTotal === "number" && Math.round(args.expectedTotal) !== priced.total) {
        throw new OrderError(
          "Prices changed while you were ordering. Please review your cart and try again.",
          "total_mismatch",
          409,
        );
      }

      // Resolve identity only once the order is certain to be written: a
      // different phone number retires the sitting, and that must not happen
      // for an attempt that then fails on price or availability.
      const visit = await claimVisit(args.visitId, args.guestPhone, tx);

      const orderId = generateId("ord");
      const subOrderId = generateId("sub");
      const tokenNumber = await nextTokenNumber(stall.id, tx);

      const [order] = await tx<Order[]>`
        insert into orders (id, public_token, table_id, visit_id, fulfillment_type, guest_phone)
        values (
          ${orderId}, ${generatePublicToken()}, ${table.id}, ${visit.id}, 'dine_in',
          ${normalisePhone(args.guestPhone)}
        )
        returning *
      `;

      const [subOrder] = await tx<SubOrder[]>`
        insert into sub_orders (
          id, order_id, stall_id, token_number, status, payment_method, payment_status,
          subtotal, tax_amount, total, special_instructions
        ) values (
          ${subOrderId}, ${orderId}, ${stall.id}, ${tokenNumber}, 'PLACED',
          ${args.paymentMethod}, 'PENDING',
          ${priced.subtotal}, ${priced.taxAmount}, ${priced.total},
          ${args.specialInstructions?.slice(0, 120) ?? null}
        )
        returning *
      `;

      for (const line of priced.lines) {
        await tx`
          insert into sub_order_items (
            id, sub_order_id, item_id, variant_id, item_name_snapshot, variant_name_snapshot,
            unit_price_snapshot, quantity, addons_snapshot, line_total
          ) values (
            ${generateId("soi")}, ${subOrderId}, ${line.itemId}, ${line.variantId ?? null},
            ${line.itemNameSnapshot}, ${line.variantNameSnapshot ?? null},
            ${line.unitPriceSnapshot}, ${line.quantity},
            ${tx.json(line.addonsSnapshot as never)}, ${line.lineTotal}
          )
        `;
      }

      // Last, so a duplicate that got this far still rolls back cleanly. The
      // primary key is the arbiter: the loser's insert fails and it replays.
      await tx`insert into idempotency_keys (key, order_id) values (${args.idempotencyKey}, ${orderId})`;

      return {
        order,
        visitId: visit.id,
        subOrder: await toView(subOrder, tx),
        replayed: false,
      };
    });
  } catch (err) {
    // A concurrent double-tap lost the race on the idempotency primary key.
    // That is a success from the student's point of view: their order exists.
    if (isUniqueViolation(err)) {
      const replayed = await findByIdempotencyKey(args.idempotencyKey);
      if (replayed) return replayed;
    }
    throw err;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

/**
 * Whether this checkout has already been written.
 *
 * A cheap primary-key probe, used by the order route so that a replay does not
 * spend the student's rate-limit budget. A phone retrying on a bad connection
 * is placing one order, not ten, and must never be answered with "too many
 * orders too quickly" for food that is already on the counter.
 */
export async function isKnownIdempotencyKey(key: string): Promise<boolean> {
  const rows = await sql`select 1 from idempotency_keys where key = ${key}`;
  return rows.length > 0;
}

async function findByIdempotencyKey(key: string): Promise<CreateOrderResult | null> {
  const [order] = await sql<Order[]>`
    select o.* from orders o
    join idempotency_keys k on k.order_id = o.id
    where k.key = ${key}
  `;
  if (!order) return null;
  const [sub] = await sql<SubOrder[]>`
    select * from sub_orders where order_id = ${order.id} order by created_at limit 1
  `;
  if (!sub) return null;
  return { order, visitId: order.visitId, subOrder: await toView(sub), replayed: true };
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

export async function advanceStatus(stallId: string, subOrderId: string): Promise<SubOrderView> {
  return sql.begin(async (tx) => {
    // Locks the row for the duration: two staff phones tapping "Ready" at the
    // same moment must not both read PREPARING and both advance it.
    const [sub] = await tx<SubOrder[]>`
      select * from sub_orders where id = ${subOrderId} and stall_id = ${stallId} for update
    `;
    if (!sub) throw new OrderError("Order not found.", "not_found", 404);

    const blocked = blockedReason(sub);
    if (blocked) throw new OrderError(blocked, "transition_blocked", 409);

    const next = FORWARD[sub.status];
    if (!next) throw new OrderError("This order cannot move any further.", "transition_blocked", 409);

    let paymentStatus = sub.paymentStatus;
    let paidConfirmedAt = sub.paidConfirmedAt ?? null;

    if (next === "COMPLETED") {
      // COMPLETED means the student has the food and the stall has the money.
      // For cash that is the moment of collection, so confirm payment here.
      if (sub.paymentMethod === "cash" && paymentStatus === "PENDING") {
        paymentStatus = "CONFIRMED";
        paidConfirmedAt = new Date().toISOString();
      }
      if (paymentStatus !== "CONFIRMED") {
        throw new OrderError("Payment is not confirmed for this order yet.", "payment_unconfirmed", 409);
      }
    }

    const [updated] = await tx<SubOrder[]>`
      update sub_orders set
        status = ${next},
        payment_status = ${paymentStatus},
        paid_confirmed_at = ${paidConfirmedAt},
        accepted_at  = ${next === "ACCEPTED" ? sql`now()` : sql`accepted_at`},
        ready_at     = ${next === "READY" ? sql`now()` : sql`ready_at`},
        completed_at = ${next === "COMPLETED" ? sql`now()` : sql`completed_at`}
      where id = ${sub.id}
      returning *
    `;
    return toView(updated, tx);
  });
}

export async function cancelByStall(
  stallId: string,
  subOrderId: string,
  reason: string,
): Promise<SubOrderView> {
  return sql.begin(async (tx) => {
    const [sub] = await tx<SubOrder[]>`
      select * from sub_orders where id = ${subOrderId} and stall_id = ${stallId} for update
    `;
    if (!sub) throw new OrderError("Order not found.", "not_found", 404);
    if (sub.status !== "PLACED" && sub.status !== "ACCEPTED") {
      throw new OrderError("Only a new or accepted order can be rejected.", "transition_blocked", 409);
    }

    // Money already taken has to come back. Surface it rather than silently
    // leaving the student out of pocket.
    const [updated] = await tx<SubOrder[]>`
      update sub_orders set
        status = 'CANCELLED',
        cancel_reason = ${reason},
        cancelled_at = now(),
        payment_status = ${sub.paymentStatus === "CONFIRMED" ? "REFUND_DUE" : sub.paymentStatus}
      where id = ${sub.id}
      returning *
    `;
    return toView(updated, tx);
  });
}

export async function cancelByGuest(publicToken: string, subOrderId: string): Promise<SubOrderView> {
  return sql.begin(async (tx) => {
    const [sub] = await tx<SubOrder[]>`
      select s.* from sub_orders s
      join orders o on o.id = s.order_id
      where s.id = ${subOrderId} and o.public_token = ${publicToken}
      for update of s
    `;
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

    const [updated] = await tx<SubOrder[]>`
      update sub_orders set
        status = 'CANCELLED',
        cancel_reason = 'Cancelled by guest',
        cancelled_at = now(),
        payment_status = ${sub.paymentStatus === "CONFIRMED" ? "REFUND_DUE" : sub.paymentStatus}
      where id = ${sub.id}
      returning *
    `;
    return toView(updated, tx);
  });
}

/* ── Payments ────────────────────────────────────────────────────────────── */

/** Guest tapped "I have paid" on a UPI order. A claim, not a confirmation. */
export async function markUpiClaimed(
  publicToken: string,
  subOrderId: string,
  reference?: string,
): Promise<SubOrderView> {
  const [sub] = await sql<SubOrder[]>`
    select s.* from sub_orders s
    join orders o on o.id = s.order_id
    where s.id = ${subOrderId} and o.public_token = ${publicToken}
  `;
  if (!sub) throw new OrderError("Order not found.", "not_found", 404);
  if (sub.paymentMethod !== "upi") {
    throw new OrderError("That order is not a UPI order.", "not_upi", 409);
  }
  // Already verified by staff — a guest claim cannot walk that back.
  if (sub.paymentStatus === "CONFIRMED") return toView(sub);

  const [updated] = await sql<SubOrder[]>`
    update sub_orders set
      payment_status = 'AWAITING_CONFIRMATION',
      upi_reference = ${reference ? reference.slice(0, 40) : sql`upi_reference`}
    where id = ${sub.id}
    returning *
  `;
  return toView(updated);
}

export async function setPaymentStatus(
  stallId: string,
  subOrderId: string,
  paymentStatus: PaymentStatus,
  actorId: string,
): Promise<SubOrderView> {
  const [updated] = await sql<SubOrder[]>`
    update sub_orders set
      payment_status = ${paymentStatus},
      paid_confirmed_by = ${paymentStatus === "CONFIRMED" ? actorId : sql`paid_confirmed_by`},
      paid_confirmed_at = ${paymentStatus === "CONFIRMED" ? sql`now()` : sql`paid_confirmed_at`},
      refunded_at = ${paymentStatus === "REFUNDED" ? sql`now()` : sql`refunded_at`}
    where id = ${subOrderId} and stall_id = ${stallId}
    returning *
  `;
  if (!updated) throw new OrderError("Order not found.", "not_found", 404);
  return toView(updated);
}

/* ── Reporting ───────────────────────────────────────────────────────────── */

/** Money actually in the till: confirmed, and not cancelled afterwards. */
const PAID = sql`s.payment_status = 'CONFIRMED' and s.status <> 'CANCELLED'`;

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

/**
 * Today's numbers for one stall, or the whole canteen when stallId is null.
 *
 * "Today" is the canteen's own day, not the server's: hosting runs in UTC, so
 * grouping on the raw timestamp would roll the till over at 05:30 local and
 * split a dinner service across two days. Sales count only money actually
 * confirmed — an unpaid or cancelled order is not revenue, and a stall owner
 * checking their day would spot it if it were.
 */
export async function todayStats(stallId: string | null, day: Date = new Date()): Promise<TodayStats> {
  const tz = process.env.CANTEEN_TIMEZONE || "Asia/Kolkata";
  const scope = stallId === null ? sql`true` : sql`s.stall_id = ${stallId}`;
  const sameDay = sql`
    (s.created_at at time zone ${tz})::date = (${day.toISOString()}::timestamptz at time zone ${tz})::date
  `;

  const [totals] = await sql<
    {
      orderCount: number;
      completedCount: number;
      cancelledCount: number;
      grossSales: number;
      cashSales: number;
      upiSales: number;
    }[]
  >`
    select
      count(*)::int as order_count,
      count(*) filter (where s.status = 'COMPLETED')::int as completed_count,
      count(*) filter (where s.status = 'CANCELLED')::int as cancelled_count,
      coalesce(sum(s.total) filter (where ${PAID}), 0)::int as gross_sales,
      coalesce(sum(s.total) filter (where ${PAID} and s.payment_method = 'cash'), 0)::int as cash_sales,
      coalesce(sum(s.total) filter (where ${PAID} and s.payment_method = 'upi'), 0)::int as upi_sales
    from sub_orders s
    where ${scope} and ${sameDay}
  `;

  const topItems = await sql<{ name: string; quantity: number; revenue: number }[]>`
    select i.item_name_snapshot as name,
           sum(i.quantity)::int as quantity,
           sum(i.line_total)::int as revenue
    from sub_order_items i
    join sub_orders s on s.id = i.sub_order_id
    where ${scope} and ${sameDay} and ${PAID}
    group by i.item_name_snapshot
    order by quantity desc
    limit 5
  `;

  const hourRows = await sql<{ hour: number; count: number }[]>`
    select extract(hour from (s.created_at at time zone ${tz}))::int as hour, count(*)::int as count
    from sub_orders s
    where ${scope} and ${sameDay}
    group by 1
  `;
  const byHour = new Map(hourRows.map((r) => [r.hour, r.count]));

  return {
    ...totals,
    topItems,
    hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, count: byHour.get(hour) ?? 0 })),
  };
}

/** Orders needing human attention: failed payments and refunds owed. */
export async function listProblemOrders(stallId: string | null): Promise<SubOrderView[]> {
  const subs = await sql<SubOrder[]>`
    select * from sub_orders
    where ${stallId === null ? sql`true` : sql`stall_id = ${stallId}`}
      and payment_status in ('FAILED', 'REFUND_DUE')
    order by created_at desc
  `;
  return toViews(subs);
}
