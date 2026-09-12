import { NextResponse } from "next/server";
import { clearTableSessionCookie, getTableSession } from "@/lib/api-auth";
import { endVisit } from "@/lib/store/visits";

export const dynamic = "force-dynamic";

/**
 * "Not your orders? Start fresh."
 *
 * The phone rule separates two students automatically from the first checkout
 * onwards, but a second person on a *shared* phone who has not ordered yet
 * would still see the previous person's list. This is the escape hatch for
 * that, and for a student who simply wants to hand the phone over cleanly.
 */
export async function POST() {
  const session = await getTableSession();
  if (session?.visitId) endVisit(session.visitId, "guest_ended");
  clearTableSessionCookie();
  return NextResponse.json({ ended: true });
}
