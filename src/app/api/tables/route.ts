import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { addTable, listTables } from "@/lib/store/tables";

export async function GET() {
  return NextResponse.json({ tables: listTables() });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: { number?: number; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.number || body.number < 1) {
    return NextResponse.json({ error: "A valid table number is required." }, { status: 400 });
  }

  try {
    const table = addTable(body.number, body.label);
    return NextResponse.json({ table }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not add table." }, { status: 409 });
  }
}
