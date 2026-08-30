import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createStaffToken, STAFF_COOKIE, STAFF_SESSION_TTL_SECONDS } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { authenticate } from "@/lib/store/staff";

export async function POST(request: NextRequest) {
  // Throttle credential stuffing against staff phone numbers.
  const limit = rateLimit(`login:${clientIp(request.headers)}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { phone?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = body.phone?.trim();
  const password = body.password;
  if (!phone || !password) {
    return NextResponse.json({ error: "Phone number and password are required." }, { status: 400 });
  }

  const staff = authenticate(phone, password);
  if (!staff) {
    // Same message either way — do not reveal which phone numbers are staff.
    return NextResponse.json({ error: "Incorrect phone number or password." }, { status: 401 });
  }

  const token = await createStaffToken({
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    stallId: staff.stallId,
  });

  cookies().set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_SESSION_TTL_SECONDS,
  });

  return NextResponse.json({
    ok: true,
    staff: { id: staff.id, name: staff.name, role: staff.role, stallId: staff.stallId },
  });
}
