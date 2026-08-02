import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { deleteMenuItem, getMenuItem, updateMenuItem } from "@/lib/store/menu";
import type { UpdateMenuItemInput } from "@/lib/store/menu";

interface Params {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const item = getMenuItem(params.id);
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let patch: UpdateMenuItemInput;
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updated = updateMenuItem(params.id, patch);
  if (!updated) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const ok = deleteMenuItem(params.id);
  if (!ok) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
