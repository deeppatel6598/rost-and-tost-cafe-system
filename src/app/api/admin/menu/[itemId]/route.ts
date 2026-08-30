import { NextRequest, NextResponse } from "next/server";
import { requireStallScope } from "@/lib/api-auth";
import { recordAudit } from "@/lib/store/audit";
import {
  deactivateItem,
  getItemView,
  replaceItemAddonGroups,
  replaceItemVariants,
  updateItem,
} from "@/lib/store/menu";

export const dynamic = "force-dynamic";

interface Params {
  params: { itemId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  const item = getItemView(params.itemId);
  if (!item || item.stallId !== scope.stallId) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const before = getItemView(params.itemId);
  if (!before || before.stallId !== scope.stallId) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  if (typeof body.basePrice === "number" && body.basePrice < 0) {
    return NextResponse.json({ error: "Price cannot be negative." }, { status: 400 });
  }

  const item = updateItem(scope.stallId, params.itemId, {
    name: body.name?.trim().slice(0, 80),
    description: body.description?.trim().slice(0, 200),
    basePrice: typeof body.basePrice === "number" ? Math.round(body.basePrice) : undefined,
    categoryId: body.categoryId,
    foodType: body.foodType,
    imageUrl: body.imageUrl?.trim() || undefined,
    art: body.art || undefined,
    isAvailable: typeof body.isAvailable === "boolean" ? body.isAvailable : undefined,
  });
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  if (Array.isArray(body.variants)) replaceItemVariants(item.id, body.variants);
  if (Array.isArray(body.addonGroups)) replaceItemAddonGroups(item.id, body.addonGroups);

  // A price change is money, so it is auditable on its own terms rather than
  // being folded into a generic "item edited" line.
  if (typeof body.basePrice === "number" && body.basePrice !== before.basePrice) {
    recordAudit({
      actorId: scope.session.staffId,
      actorName: scope.session.name,
      action: "menu.price_changed",
      entityType: "menu_item",
      entityId: item.id,
      before: { name: before.name, basePrice: before.basePrice },
      after: { name: item.name, basePrice: item.basePrice },
    });
  }

  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  const before = getItemView(params.itemId);
  if (!before || before.stallId !== scope.stallId) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  // Soft delete: past orders and receipts still point at this row.
  deactivateItem(scope.stallId, params.itemId);

  recordAudit({
    actorId: scope.session.staffId,
    actorName: scope.session.name,
    action: "menu.item_removed",
    entityType: "menu_item",
    entityId: params.itemId,
    before: { name: before.name, basePrice: before.basePrice },
  });

  return NextResponse.json({ ok: true });
}
