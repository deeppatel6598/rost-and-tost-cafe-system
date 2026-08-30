import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createTableToken, TABLE_COOKIE, TABLE_SESSION_TTL_SECONDS } from "@/lib/auth";
import { resolveTableByToken } from "@/lib/store/tables";

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
 */
export async function GET(request: NextRequest, { params }: Params) {
  const table = resolveTableByToken(params.qrToken);

  if (!table) {
    return NextResponse.redirect(new URL("/table-not-found", request.url));
  }

  const token = await createTableToken({ tableId: table.id, tableNumber: table.tableNumber });

  cookies().set(TABLE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TABLE_SESSION_TTL_SECONDS,
  });

  return NextResponse.redirect(new URL("/order", request.url));
}
