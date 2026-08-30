import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/api-auth";
import { getStall } from "@/lib/store/stalls";

export async function GET() {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  const stall = session.stallId ? getStall(session.stallId) : null;
  return NextResponse.json({
    authenticated: true,
    staff: {
      id: session.staffId,
      name: session.name,
      role: session.role,
      stallId: session.stallId,
      stallName: stall?.name ?? null,
    },
  });
}
