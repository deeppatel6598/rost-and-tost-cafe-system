import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createOrder, listOrders, OrderValidationError } from "@/lib/store/orders";
import { verifyTableToken } from "@/lib/table-token";
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

  // The UI already gates this, but a client can call the API directly, so
  // the table's signed link token is re-checked here — this is the actual
  // security boundary that stops someone from editing the table number in
  // the URL (or the request body) and ordering as a table they're not at.
  if (!verifyTableToken(body.tableNumber, body.tableToken)) {
    return NextResponse.json(
      { error: "This ordering link isn't valid for this table. Please scan the QR code on your table again." },
      { status: 403 },
    );
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
