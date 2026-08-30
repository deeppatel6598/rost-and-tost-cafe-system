import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { maskPhone } from "@/lib/format";
import { recordAudit } from "@/lib/store/audit";
import { createStaff, listStaff } from "@/lib/store/staff";
import { getStall } from "@/lib/store/stalls";
import type { StaffRole } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLES: StaffRole[] = ["stall_staff", "stall_owner", "super_admin"];

export async function GET() {
  const scope = await requireSuperAdmin();
  if (!scope.ok) return scope.response;

  // Never return password hashes, and mask the phone number — the supervisor
  // manages accounts, they don't need everyone's contact details in a list.
  return NextResponse.json({
    staff: listStaff().map((s) => ({
      id: s.id,
      name: s.name,
      phoneMasked: maskPhone(s.phone),
      role: s.role,
      stallId: s.stallId,
      stallName: s.stallId ? getStall(s.stallId)?.name ?? null : null,
      isActive: s.isActive,
    })),
  });
}

export async function POST(request: NextRequest) {
  const scope = await requireSuperAdmin();
  if (!scope.ok) return scope.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = String(body.phone ?? "").replace(/\D/g, "");
  const password = String(body.password ?? "");
  const role: StaffRole = ROLES.includes(body.role) ? body.role : "stall_staff";

  if (!body.name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (phone.length !== 10) return NextResponse.json({ error: "Enter a 10-digit phone number." }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (role !== "super_admin" && !getStall(body.stallId)) {
    return NextResponse.json({ error: "Choose which stall this account belongs to." }, { status: 400 });
  }

  try {
    const staff = createStaff({
      name: String(body.name).trim().slice(0, 60),
      phone,
      password,
      role,
      stallId: role === "super_admin" ? null : body.stallId,
    });

    recordAudit({
      actorId: scope.session.staffId,
      actorName: scope.session.name,
      action: "staff.created",
      entityType: "staff_user",
      entityId: staff.id,
      after: { name: staff.name, role: staff.role, stallId: staff.stallId },
    });

    return NextResponse.json(
      { staff: { id: staff.id, name: staff.name, role: staff.role, stallId: staff.stallId } },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create the account." },
      { status: 409 },
    );
  }
}
