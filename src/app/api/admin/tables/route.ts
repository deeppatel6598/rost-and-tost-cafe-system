import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/api-auth";
import { getTablePath } from "@/lib/qrcode";
import { listTables } from "@/lib/store/tables";

export const dynamic = "force-dynamic";

/**
 * Table list with their signed ordering paths, for printing QR stickers.
 * Any signed-in staff member may read this — tables are shared canteen
 * infrastructure, not a per-stall asset.
 */
export async function GET(_request: NextRequest) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  return NextResponse.json({
    tables: listTables().map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      isActive: t.isActive,
      path: getTablePath(t),
    })),
  });
}
