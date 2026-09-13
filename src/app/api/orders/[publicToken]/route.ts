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
 *
 * Because the link *is* the credential, this response must carry nothing the
 * link holder should not have. The phone number is stripped here: it is now
 * mandatory at checkout, so leaving it in would hand a real number to anyone
 * who saw the URL over a shoulder or in a shared browser history. Staff still
 * get it, through the authenticated stall route.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const subOrders = await getSubOrdersByPublicToken(params.publicToken);
  if (subOrders.length === 0) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // One query for the stalls involved, not one per sub-order.
  const stallIds = [...new Set(subOrders.map((s) => s.stallId))];
  const stalls = new Map(
    (await Promise.all(stallIds.map((id) => getStall(id)))).flatMap((s) => (s ? [[s.id, s] as const] : [])),
  );

  const enriched = subOrders.map((sub) => {
    const stall = stalls.get(sub.stallId);
    const { guestPhone: _guestPhone, ...safe } = sub;
    return {
      ...safe,
      upiLink:
        sub.paymentMethod === "upi" && stall && sub.paymentStatus !== "CONFIRMED"
          ? buildUpiLink(stall, sub.total, sub.tokenNumber)
          : null,
      upiVpa: sub.paymentMethod === "upi" ? stall?.upiVpa ?? null : null,
    };
  });

  return NextResponse.json({ subOrders: enriched });
}
