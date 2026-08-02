import { generateId, generateOrderCode } from "@/lib/format";
import { db } from "@/lib/store/db";
import type { CartLineInput, CreateOrderInput, Order, OrderLine, OrderStatus, SelectedOption } from "@/lib/types";

const STATUS_SEQUENCE: OrderStatus[] = ["received", "preparing", "served"];

export class OrderValidationError extends Error {}

function resolveLine(input: CartLineInput): OrderLine {
  const item = db.menuItems.find((m) => m.id === input.menuItemId);
  if (!item) throw new OrderValidationError(`Unknown menu item: ${input.menuItemId}`);
  if (!item.available) throw new OrderValidationError(`${item.name} is sold out right now.`);
  if (input.qty < 1 || !Number.isInteger(input.qty)) {
    throw new OrderValidationError(`Invalid quantity for ${item.name}.`);
  }

  const selectedOptions: SelectedOption[] = input.selectedChoiceIds.map(({ groupId, choiceId }) => {
    const group = item.optionGroups.find((g) => g.id === groupId);
    const choice = group?.choices.find((c) => c.id === choiceId);
    if (!group || !choice) {
      throw new OrderValidationError(`Invalid option selection for ${item.name}.`);
    }
    return { groupId: group.id, groupName: group.name, choiceId: choice.id, label: choice.label, priceDelta: choice.priceDelta };
  });

  for (const group of item.optionGroups) {
    if (group.required && !selectedOptions.some((o) => o.groupId === group.id)) {
      throw new OrderValidationError(`${item.name} needs a choice for "${group.name}".`);
    }
  }

  const unitAddOns = selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
  const unitPrice = item.price;
  const amount = (unitPrice + unitAddOns) * input.qty;

  return {
    id: generateId("line"),
    menuItemId: item.id,
    name: item.name,
    qty: input.qty,
    unitPrice,
    selectedOptions,
    lineNote: input.lineNote,
    amount,
    done: false,
  };
}

export function listOrders(): Order[] {
  return [...db.orders].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
}

export function getOrder(id: string): Order | undefined {
  return db.orders.find((o) => o.id === id);
}

export function listOrdersForTable(tableNumber: number): Order[] {
  return db.orders
    .filter((o) => o.tableNumber === tableNumber)
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
}

export function createOrder(input: CreateOrderInput): Order {
  if (!input.lines.length) {
    throw new OrderValidationError("Your order is empty.");
  }
  const lines = input.lines.map(resolveLine);
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const now = new Date().toISOString();

  db.orderSequence += 1;
  const round = db.orders.filter((o) => o.tableNumber === input.tableNumber && o.status !== "cancelled").length + 1;

  const order: Order = {
    id: generateOrderCode(db.orderSequence),
    tableNumber: input.tableNumber,
    status: "received",
    lines,
    note: input.note,
    total,
    placedAt: now,
    updatedAt: now,
    round,
  };
  db.orders.push(order);

  const table = db.tables.find((t) => t.number === input.tableNumber);
  if (table) table.status = "occupied";

  return order;
}

export function advanceOrderStatus(id: string): Order | undefined {
  const order = db.orders.find((o) => o.id === id);
  if (!order || order.status === "cancelled") return order;
  const idx = STATUS_SEQUENCE.indexOf(order.status);
  const next = STATUS_SEQUENCE[Math.min(idx + 1, STATUS_SEQUENCE.length - 1)];
  order.status = next;
  order.updatedAt = new Date().toISOString();
  if (next === "served") order.servedAt = order.updatedAt;
  syncTableStatus(order.tableNumber);
  return order;
}

export function setOrderStatus(id: string, status: OrderStatus): Order | undefined {
  const order = db.orders.find((o) => o.id === id);
  if (!order) return undefined;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  if (status === "served") order.servedAt = order.updatedAt;
  syncTableStatus(order.tableNumber);
  return order;
}

export function cancelOrder(id: string, reason: string): Order | undefined {
  const order = db.orders.find((o) => o.id === id);
  if (!order) return undefined;
  order.status = "cancelled";
  order.cancelReason = reason;
  order.cancelledAt = new Date().toISOString();
  order.updatedAt = order.cancelledAt;
  syncTableStatus(order.tableNumber);
  return order;
}

export function setLineDone(orderId: string, lineId: string, done: boolean): Order | undefined {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return undefined;
  const line = order.lines.find((l) => l.id === lineId);
  if (!line) return undefined;
  line.done = done;
  order.updatedAt = new Date().toISOString();
  return order;
}

function syncTableStatus(tableNumber: number) {
  const table = db.tables.find((t) => t.number === tableNumber);
  if (!table) return;
  const hasOpenOrder = db.orders.some(
    (o) => o.tableNumber === tableNumber && o.status !== "served" && o.status !== "cancelled",
  );
  table.status = hasOpenOrder ? "occupied" : table.status;
}

export function listOrdersByDay(): { day: string; orders: Order[] }[] {
  const groups = new Map<string, Order[]>();
  for (const order of listOrders()) {
    const day = order.placedAt.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(order);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, orders]) => ({ day, orders }));
}
