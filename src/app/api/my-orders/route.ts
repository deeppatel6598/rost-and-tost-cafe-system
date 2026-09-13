import { NextResponse } from "next/server";
import { requireTableSession, resolveVisitId } from "@/lib/api-auth";
import { readDeviceHash } from "@/lib/device";
import { listOrdersForSession } from "@/lib/store/orders";
import { isPhoneVerified } from "@/lib/store/otp";
import { getVisit } from "@/lib/store/visits";

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
 *
 * That fan-out needs a verified number, so the response also says whether this
 * browser has one. The prompt to verify is offered whenever the sitting has a
 * phone and the browser has not proved it — never conditioned on whether more
 * orders actually exist, since "there are more orders under this number" would
 * itself confirm that a guessed number is in use.
 */
export async function GET() {
  const scope = await requireTableSession();
  if (!scope.ok) return scope.response;

  const visitId = await resolveVisitId(scope.session);
  const deviceHash = readDeviceHash();
  const visit = await getVisit(visitId);
  const phone = visit?.guestPhone;
  const verified = phone ? await isPhoneVerified(phone, deviceHash) : false;

  return NextResponse.json({
    subOrders: await listOrdersForSession(visitId, deviceHash),
    // The number is echoed back only to the browser that is already ordering
    // under it, so the code-entry screen can show it without asking again.
    phone: phone ?? null,
    verified,
    canVerify: Boolean(phone) && !verified,
  });
}
