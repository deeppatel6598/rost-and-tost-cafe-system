import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { STAFF_COOKIE } from "@/lib/auth";

export async function POST() {
  cookies().delete(STAFF_COOKIE);
  return NextResponse.json({ ok: true });
}
