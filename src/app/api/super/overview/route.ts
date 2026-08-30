import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { listProblemOrders, todayStats } from "@/lib/store/orders";
import { listStallViews } from "@/lib/store/stalls";

export const dynamic = "force-dynamic";

/**
 * Read-mostly view across all four stalls. Deliberately does not expose menu
 * or price editing — the supervisor oversees the canteen, but each stall's
 * menu and prices are that business's own.
 */
export async function GET() {
  const scope = await requireSuperAdmin();
  if (!scope.ok) return scope.response;

  const stalls = listStallViews();
  return NextResponse.json({
    canteen: todayStats(null),
    problems: listProblemOrders(null),
    stalls: stalls.map((stall) => ({
      id: stall.id,
      name: stall.name,
      availability: stall.availability,
      acceptsCash: stall.acceptsCash,
      acceptsUpi: stall.acceptsUpi,
      stats: todayStats(stall.id),
    })),
  });
}
