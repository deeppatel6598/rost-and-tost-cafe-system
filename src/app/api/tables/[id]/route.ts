import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { removeTable } from "@/lib/store/tables";

interface Params {
  params: { id: string };
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const ok = removeTable(params.id);
  if (!ok) return NextResponse.json({ error: "Table not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
