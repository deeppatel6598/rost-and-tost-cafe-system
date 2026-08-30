import { NextRequest, NextResponse } from "next/server";
import { requireStallScope } from "@/lib/api-auth";
import { getItem, setItemAvailability } from "@/lib/store/menu";

export const dynamic = "force-dynamic";

interface Params {
  params: { itemId: string };
}

/**
 * The sold-out toggle — the single most-used control in the whole admin,
 * hit dozens of times a day. Deliberately its own tiny endpoint: one tap,
 * no confirmation, no payload beyond the new state, so it stays instant on a
 * bad connection behind a busy counter.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  let body: { isAvailable?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.isAvailable !== "boolean") {
    return NextResponse.json({ error: "isAvailable is required." }, { status: 400 });
  }

  const existing = getItem(params.itemId);
  if (!existing || existing.stallId !== scope.stallId) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  const item = setItemAvailability(scope.stallId, params.itemId, body.isAvailable);
  return NextResponse.json({ item });
}
