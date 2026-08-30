import { NextRequest, NextResponse } from "next/server";
import { getSubOrdersByPublicToken } from "@/lib/store/orders";
import { getStall } from "@/lib/store/stalls";
import { buildUpiLink } from "@/lib/upi";

export const dynamic = "force-dynamic";

interface Params {
  params: { publicToken: string };
}

/**
 * Guest-facing order status. Addressed by the random public_token, never by a
 * sequential id, so possession of the link is the only way to read an order.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const subOrders = getSubOrdersByPublicToken(params.publicToken);
  if (subOrders.length === 0) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const enriched = subOrders.map((sub) => {
    const stall = getStall(sub.stallId);
    return {
      ...sub,
      upiLink:
        sub.paymentMethod === "upi" && stall && sub.paymentStatus !== "CONFIRMED"
          ? buildUpiLink(stall, sub.total, sub.tokenNumber)
          : null,
      upiVpa: sub.paymentMethod === "upi" ? stall?.upiVpa ?? null : null,
    };
  });

  return NextResponse.json({ subOrders: enriched });
}
