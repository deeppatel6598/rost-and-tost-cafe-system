import { NextRequest, NextResponse } from "next/server";
import { requireStallScope } from "@/lib/api-auth";
import { recordAudit } from "@/lib/store/audit";
import { createItem, listCategories, listStallMenu, replaceItemAddonGroups, replaceItemVariants } from "@/lib/store/menu";
import type { FoodType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  return NextResponse.json({
    categories: await listCategories(scope.stallId),
    items: await listStallMenu(scope.stallId),
  });
}

export async function POST(request: NextRequest) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.name?.trim() || !body.categoryId || typeof body.basePrice !== "number") {
    return NextResponse.json({ error: "Name, category and price are required." }, { status: 400 });
  }
  if (body.basePrice < 0) {
    return NextResponse.json({ error: "Price cannot be negative." }, { status: 400 });
  }

  // The category must belong to this stall — otherwise an item could be filed
  // under a competitor's menu.
  const categories = await listCategories(scope.stallId);
  if (!categories.some((c) => c.id === body.categoryId)) {
    return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  }

  const existing = await listStallMenu(scope.stallId);
  const item = await createItem({
    stallId: scope.stallId,
    categoryId: body.categoryId,
    name: String(body.name).trim().slice(0, 80),
    description: String(body.description ?? "").trim().slice(0, 200),
    basePrice: Math.round(body.basePrice),
    imageUrl: body.imageUrl?.trim() || undefined,
    art: body.art || undefined,
    foodType: (body.foodType as FoodType) ?? "veg",
    isAvailable: body.isAvailable !== false,
    sortOrder: existing.length,
  });

  if (Array.isArray(body.variants)) await replaceItemVariants(item.id, body.variants);
  if (Array.isArray(body.addonGroups)) await replaceItemAddonGroups(item.id, body.addonGroups);

  await recordAudit({
    actorId: scope.session.staffId,
    actorName: scope.session.name,
    action: "menu.item_created",
    entityType: "menu_item",
    entityId: item.id,
    after: { name: item.name, basePrice: item.basePrice },
  });

  return NextResponse.json({ item }, { status: 201 });
}
