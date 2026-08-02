import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { cancelOrder } from "@/lib/store/orders";

interface Params {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const order = cancelOrder(params.id, body.reason?.trim() || "No reason given");
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order });
}
