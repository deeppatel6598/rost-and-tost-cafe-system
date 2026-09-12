import { NextResponse } from "next/server";
import { requireTableSession, resolveVisitId } from "@/lib/api-auth";
import { listOrdersForSession } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

/**
 * This student's orders, from the server rather than from browser storage.
 *
 * Closing the tab used to lose the order list for good, because the only
 * handle on an order lived in one browser's localStorage. Now the seating
 * cookie is the handle and the list is rebuilt server-side, so reopening the
 * site — or re-scanning the table code — brings it back.
 *
 * The list follows the *person*: every current visit carrying their number,
 * across tables. Food is collected at the counter when a token is called, so
 * moving seats must not strand an order.
 */
export async function GET() {
  const scope = await requireTableSession();
  if (!scope.ok) return scope.response;

  const visitId = await resolveVisitId(scope.session);
  return NextResponse.json({ subOrders: listOrdersForSession(visitId) });
}
