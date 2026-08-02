import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { generateTableQrPng } from "@/lib/qrcode";

interface Params {
  params: { number: string };
}

/**
 * Reconstructs the public origin the request actually arrived on. Netlify,
 * Vercel and most other hosts proxy requests and set x-forwarded-*, so
 * request.nextUrl.origin alone can't be trusted — it may reflect an internal
 * function URL rather than the domain the visitor typed.
 */
function getRequestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest, { params }: Params) {
  // Staff-only: this endpoint mints a table's signed order link. Leaving it
  // public would let anyone remotely harvest a valid token for every table
  // number, defeating the point of signing the links in the first place.
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const number = Number(params.number);
  if (!Number.isInteger(number) || number < 1) {
    return NextResponse.json({ error: "Invalid table number." }, { status: 400 });
  }

  const png = await generateTableQrPng(number, getRequestOrigin(request));
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": `inline; filename="table-${number}-qr.png"`,
    },
  });
}
