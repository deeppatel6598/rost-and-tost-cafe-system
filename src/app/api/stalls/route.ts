import { NextResponse } from "next/server";
import { listStallViews } from "@/lib/store/stalls";

export const dynamic = "force-dynamic";

/** Public: the four stalls with their current open/closed/paused state. */
export async function GET() {
  const stalls = listStallViews().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    logoUrl: s.logoUrl,
    art: s.art,
    acceptsCash: s.acceptsCash,
    acceptsUpi: s.acceptsUpi,
    opensAt: s.opensAt,
    closesAt: s.closesAt,
    availability: s.availability,
  }));
  return NextResponse.json({ stalls });
}
