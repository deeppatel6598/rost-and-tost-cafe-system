import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getTableOrderPath } from "@/lib/qrcode";

interface Params {
  params: { number: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const number = Number(params.number);
  if (!Number.isInteger(number) || number < 1) {
    return NextResponse.json({ error: "Invalid table number." }, { status: 400 });
  }

  return NextResponse.json({ path: getTableOrderPath(number) });
}
