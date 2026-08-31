import { NextRequest, NextResponse } from "next/server";
import { isOwnerOrAbove, requireStallScope } from "@/lib/api-auth";
import { recordAudit } from "@/lib/store/audit";
import { getStall, toStallView, updateStall } from "@/lib/store/stalls";
import type { ServiceMode } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const SERVICE_MODES: ServiceMode[] = ["scheduled", "open", "closed"];

export async function GET(request: NextRequest) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  const stall = getStall(scope.stallId);
  if (!stall) return NextResponse.json({ error: "Stall not found." }, { status: 404 });
  return NextResponse.json({ stall: toStallView(stall) });
}

export async function PATCH(request: NextRequest) {
  const scope = await requireStallScope(request.nextUrl.searchParams.get("stallId"));
  if (!scope.ok) return scope.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const before = getStall(scope.stallId);
  if (!before) return NextResponse.json({ error: "Stall not found." }, { status: 404 });

  // Changing the UPI VPA redirects where every future rupee lands, so it is
  // owner-only and separately audited. Counter staff can open and close the
  // stall all day; they cannot repoint the money.
  const changingPayout =
    (typeof body.upiVpa === "string" && body.upiVpa.trim() !== before.upiVpa) ||
    (typeof body.upiPayeeName === "string" && body.upiPayeeName.trim() !== before.upiPayeeName);

  if (changingPayout && !isOwnerOrAbove(scope.session)) {
    return NextResponse.json({ error: "Only the stall owner can change payment details." }, { status: 403 });
  }

  for (const key of ["opensAt", "closesAt"] as const) {
    if (typeof body[key] === "string" && !TIME_PATTERN.test(body[key])) {
      return NextResponse.json({ error: "Hours must look like 09:00." }, { status: 400 });
    }
  }

  const stall = updateStall(scope.stallId, {
    serviceMode: SERVICE_MODES.includes(body.serviceMode) ? body.serviceMode : undefined,
    isPaused: typeof body.isPaused === "boolean" ? body.isPaused : undefined,
    opensAt: typeof body.opensAt === "string" ? body.opensAt : undefined,
    closesAt: typeof body.closesAt === "string" ? body.closesAt : undefined,
    acceptsCash: typeof body.acceptsCash === "boolean" ? body.acceptsCash : undefined,
    acceptsUpi: typeof body.acceptsUpi === "boolean" ? body.acceptsUpi : undefined,
    upiVpa: typeof body.upiVpa === "string" ? body.upiVpa.trim().slice(0, 80) : undefined,
    upiPayeeName: typeof body.upiPayeeName === "string" ? body.upiPayeeName.trim().slice(0, 80) : undefined,
    description: typeof body.description === "string" ? body.description.trim().slice(0, 160) : undefined,
  });
  if (!stall) return NextResponse.json({ error: "Stall not found." }, { status: 404 });

  if (changingPayout) {
    recordAudit({
      actorId: scope.session.staffId,
      actorName: scope.session.name,
      action: "stall.payout_changed",
      entityType: "stall",
      entityId: stall.id,
      before: { upiVpa: before.upiVpa, upiPayeeName: before.upiPayeeName },
      after: { upiVpa: stall.upiVpa, upiPayeeName: stall.upiPayeeName },
    });
  }

  return NextResponse.json({ stall: toStallView(stall) });
}
