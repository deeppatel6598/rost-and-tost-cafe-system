import { NextRequest, NextResponse } from "next/server";
import { requireStallScope } from "@/lib/api-auth";
import { recordAudit } from "@/lib/store/audit";
import { getSubOrderForStall, OrderError, setPaymentStatus } from "@/lib/store/orders";
import type { PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Params {
  params: { subOrderId: string };
}

/** Only these transitions may be driven by staff from the queue. */
const ALLOWED: PaymentStatus[] = ["CONFIRMED", "FAILED", "REFUNDED"];

/**
 * Staff verifying money. This is the only path to CONFIRMED for a UPI order —
 * a member of staff has seen the payment land in the stall's own UPI app.
 * Every call is written to the audit log: four competing businesses share this
 * system and payment disputes are a matter of when, not if.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  let body: { paymentStatus?: PaymentStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.paymentStatus || !ALLOWED.includes(body.paymentStatus)) {
    return NextResponse.json({ error: "Unsupported payment status." }, { status: 400 });
  }

  const before = getSubOrderForStall(scope.stallId, params.subOrderId);
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  try {
    const subOrder = setPaymentStatus(
      scope.stallId,
      params.subOrderId,
      body.paymentStatus,
      scope.session.staffId,
    );

    recordAudit({
      actorId: scope.session.staffId,
      actorName: scope.session.name,
      action: `payment.${body.paymentStatus.toLowerCase()}`,
      entityType: "sub_order",
      entityId: subOrder.id,
      before: { paymentStatus: before.paymentStatus, total: before.total },
      after: { paymentStatus: subOrder.paymentStatus, total: subOrder.total },
    });

    return NextResponse.json({ subOrder });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not update the payment." }, { status: 500 });
  }
}
