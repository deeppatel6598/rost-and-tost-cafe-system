import { NextRequest, NextResponse } from "next/server";
import { listCategories, listStallMenu } from "@/lib/store/menu";
import { getStall, toStallView } from "@/lib/store/stalls";

export const dynamic = "force-dynamic";

interface Params {
  params: { stallId: string };
}

/**
 * Public menu for one stall. Sold-out items are included, not filtered out —
 * a student looking for a specific item needs to see it marked unavailable,
 * otherwise they assume the app is broken and ask staff anyway.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const stall = getStall(params.stallId);
  if (!stall) return NextResponse.json({ error: "Stall not found." }, { status: 404 });

  return NextResponse.json({
    stall: toStallView(stall),
    categories: listCategories(stall.id),
    items: listStallMenu(stall.id),
  });
}
