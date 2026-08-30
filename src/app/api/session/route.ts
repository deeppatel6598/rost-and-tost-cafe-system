import { NextResponse } from "next/server";
import { getTableSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** Which table this browser is seated at, if any. */
export async function GET() {
  const session = await getTableSession();
  if (!session) return NextResponse.json({ seated: false }, { status: 200 });
  return NextResponse.json({ seated: true, tableNumber: session.tableNumber });
}
