import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { listAudit } from "@/lib/store/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await requireSuperAdmin();
  if (!scope.ok) return scope.response;
  return NextResponse.json({ logs: listAudit(200) });
}
