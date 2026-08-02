import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { setLineDone } from "@/lib/store/orders";

interface Params {
  params: { id: string; lineId: string };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { done?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const order = setLineDone(params.id, params.lineId, Boolean(body.done));
  if (!order) return NextResponse.json({ error: "Order or line not found." }, { status: 404 });
  return NextResponse.json({ order });
}
