import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createOrder, listOrders, OrderValidationError } from "@/lib/store/orders";
import type { CreateOrderInput } from "@/lib/types";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const table = request.nextUrl.searchParams.get("table");
  let orders = listOrders();
  if (table) orders = orders.filter((o) => o.tableNumber === Number(table));
  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  let body: CreateOrderInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.tableNumber || !Array.isArray(body.lines)) {
    return NextResponse.json({ error: "tableNumber and lines are required." }, { status: 400 });
  }

  try {
    const order = createOrder(body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Could not place order." }, { status: 500 });
  }
}
