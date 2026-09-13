import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createTableToken, TABLE_COOKIE, TABLE_SESSION_TTL_SECONDS } from "@/lib/auth";
import { getTableSession } from "@/lib/api-auth";
import { resolveTableByToken } from "@/lib/store/tables";
import { getCurrentVisitForTable, openVisit, touchVisit } from "@/lib/store/visits";

export const dynamic = "force-dynamic";

interface Params {
  params: { qrToken: string };
}

/**
 * The URL a table's QR sticker encodes.
 *
 * Validates the signed token server-side, resolves it to a real table, drops
 * a short-lived session cookie recording where the student is sitting, and
 * sends them to stall selection. The table is never read from a query
 * parameter and never trusted from the client after this point — every order
 * takes its table from this cookie.
 *
 * Re-scanning is the normal way back in after closing the tab, so this rejoins
 * the sitting the cookie already names rather than starting a new one. A scan
 * with no usable cookie opens a fresh, anonymous visit; it stays anonymous
 * until the first checkout stamps a phone number on it.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const table = await resolveTableByToken(params.qrToken);

  if (!table) {
    return NextResponse.redirect(new URL("/table-not-found", request.url));
  }

  const existing = await getTableSession();
  const rejoined = await getCurrentVisitForTable(existing?.visitId, table.id);
  if (rejoined) await touchVisit(rejoined.id);
  const visit = rejoined ?? await openVisit(table.id);

  const token = await createTableToken({
    tableId: table.id,
    tableNumber: table.tableNumber,
    visitId: visit.id,
  });

  cookies().set(TABLE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TABLE_SESSION_TTL_SECONDS,
  });

  return NextResponse.redirect(new URL("/order", request.url));
}
