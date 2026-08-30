import { NextRequest, NextResponse } from "next/server";
import { cancelByGuest, OrderError } from "@/lib/store/orders";
import { recordAudit } from "@/lib/store/audit";

export const dynamic = "force-dynamic";

interface Params {
  params: { publicToken: string; subOrderId: string };
}

/** Guest self-cancel. Only within the 90s window and only while still PLACED. */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const before = { subOrderId: params.subOrderId };
    const subOrder = cancelByGuest(params.publicToken, params.subOrderId);

    recordAudit({
      actorId: "guest",
      actorName: `Table ${subOrder.tableNumber}`,
      action: "order.cancelled_by_guest",
      entityType: "sub_order",
      entityId: subOrder.id,
      before,
      after: { status: subOrder.status, paymentStatus: subOrder.paymentStatus },
    });

    return NextResponse.json({ subOrder });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not cancel the order." }, { status: 500 });
  }
}
