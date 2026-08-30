import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/api-auth";
import { generateTableQrPng } from "@/lib/qrcode";
import { getTableById } from "@/lib/store/tables";

export const dynamic = "force-dynamic";

interface Params {
  params: { tableId: string };
}

/**
 * Reconstructs the public origin the request arrived on, so a downloaded QR
 * points at the deployment it was generated from rather than at localhost.
 */
function getRequestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Staff-only. This endpoint mints a table's signed ordering link; leaving it
 * public would let anyone harvest a valid token for every table in the hall,
 * which is the whole thing the signature is there to prevent.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const table = getTableById(params.tableId);
  if (!table) return NextResponse.json({ error: "Table not found." }, { status: 404 });

  const png = await generateTableQrPng(table, getRequestOrigin(request));
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="table-${table.tableNumber}-qr.png"`,
    },
  });
}
