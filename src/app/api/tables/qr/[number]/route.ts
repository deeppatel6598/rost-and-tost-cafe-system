import { NextRequest, NextResponse } from "next/server";
import { generateTableQrPng } from "@/lib/qrcode";

interface Params {
  params: { number: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const number = Number(params.number);
  if (!Number.isInteger(number) || number < 1) {
    return NextResponse.json({ error: "Invalid table number." }, { status: 400 });
  }

  const png = await generateTableQrPng(number);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": `inline; filename="table-${number}-qr.png"`,
    },
  });
}
