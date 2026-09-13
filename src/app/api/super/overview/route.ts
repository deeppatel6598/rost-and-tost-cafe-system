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

  const stalls = await listStallViews();
  // Four stalls' day summaries in parallel rather than one after another.
  const [canteen, problems, perStall] = await Promise.all([
    todayStats(null),
    listProblemOrders(null),
    Promise.all(
      stalls.map(async (stall) => ({
        id: stall.id,
        name: stall.name,
        availability: stall.availability,
        acceptsCash: stall.acceptsCash,
        acceptsUpi: stall.acceptsUpi,
        stats: await todayStats(stall.id),
      })),
    ),
  ]);

  return NextResponse.json({ canteen, problems, stalls: perStall });
}
