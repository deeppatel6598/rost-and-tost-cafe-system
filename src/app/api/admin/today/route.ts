import { NextRequest, NextResponse } from "next/server";
import { requireStallScope } from "@/lib/api-auth";
import { listProblemOrders, todayStats } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

/** What a stall owner actually opens the app to check. */
export async function GET(request: NextRequest) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  return NextResponse.json({
    stats: todayStats(scope.stallId),
    problems: listProblemOrders(scope.stallId),
  });
}
