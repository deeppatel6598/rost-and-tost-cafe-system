import { NextRequest, NextResponse } from "next/server";
import { requireStallScope } from "@/lib/api-auth";
import { listSubOrdersForStall } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

/**
 * The stall's own order queue. Scoped by the authenticated user's stallId at
 * the query layer — a stall account cannot widen this by passing another
 * stall's id, and a super-admin must name the stall explicitly.
 */
export async function GET(request: NextRequest) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  return NextResponse.json({ orders: listSubOrdersForStall(scope.stallId) });
}
