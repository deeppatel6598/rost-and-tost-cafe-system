import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createMenuItem, listMenuItems } from "@/lib/store/menu";
import type { CreateMenuItemInput } from "@/lib/store/menu";

export async function GET() {
  return NextResponse.json({ items: listMenuItems() });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: Partial<CreateMenuItemInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.name || !body.categoryId || typeof body.price !== "number" || !body.veg) {
    return NextResponse.json({ error: "name, categoryId, price and veg are required." }, { status: 400 });
  }

  const created = createMenuItem({
    name: body.name,
    categoryId: body.categoryId,
    description: body.description ?? "",
    price: body.price,
    veg: body.veg,
    photoUrl: body.photoUrl,
    badge: body.badge,
    available: body.available ?? true,
    optionGroups: body.optionGroups ?? [],
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
