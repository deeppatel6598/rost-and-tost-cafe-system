import { NextRequest, NextResponse } from "next/server";
import { requireStallScope } from "@/lib/api-auth";
import { recordAudit } from "@/lib/store/audit";
import { cancelByStall, getSubOrderForStall, OrderError } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

interface Params {
  params: { subOrderId: string };
}

/** A reason is required — "cancelled, no reason given" is useless in a dispute. */
const REASONS = ["Item unavailable", "Stall closing", "Other"];

export async function POST(request: NextRequest, { params }: Params) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  let body: { reason?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const reason = body.reason?.trim();
  if (!reason || !REASONS.includes(reason)) {
    return NextResponse.json({ error: "Choose a reason for rejecting this order." }, { status: 400 });
  }
  const fullReason = body.note?.trim() ? `${reason} — ${body.note.trim().slice(0, 120)}` : reason;

  const before = getSubOrderForStall(scope.stallId, params.subOrderId);
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  try {
    const subOrder = cancelByStall(scope.stallId, params.subOrderId, fullReason);

    recordAudit({
      actorId: scope.session.staffId,
      actorName: scope.session.name,
      action: "order.cancelled_by_stall",
      entityType: "sub_order",
      entityId: subOrder.id,
      before: { status: before.status, paymentStatus: before.paymentStatus },
      after: {
        status: subOrder.status,
        paymentStatus: subOrder.paymentStatus,
        cancelReason: subOrder.cancelReason,
      },
    });

    return NextResponse.json({ subOrder });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not cancel the order." }, { status: 500 });
  }
}
