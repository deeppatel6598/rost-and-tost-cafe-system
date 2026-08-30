import { NextRequest, NextResponse } from "next/server";
import { markUpiClaimed, OrderError } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

interface Params {
  params: { publicToken: string; subOrderId: string };
}

/**
 * The guest tapping "I have paid".
 *
 * This records a *claim* and nothing more — it moves payment_status to
 * AWAITING_CONFIRMATION so the stall sees it in their verification queue.
 * It deliberately never sets CONFIRMED: there is no payment gateway here, the
 * client is not trusted, and only a staff member seeing the money land in
 * their own UPI app can confirm receipt.
 */
export async function POST(request: NextRequest, { params }: Params) {
  let body: { reference?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* reference is optional — an empty body is fine */
  }

  try {
    const subOrder = markUpiClaimed(
      params.publicToken,
      params.subOrderId,
      body.reference?.trim() || undefined,
    );
    return NextResponse.json({ subOrder });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not record that." }, { status: 500 });
  }
}
