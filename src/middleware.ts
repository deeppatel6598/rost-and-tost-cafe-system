import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { STAFF_COOKIE } from "@/lib/auth";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

/**
 * Gate on the admin area. This only checks that a session is valid and
 * unexpired — which stall a user may act on, and whether they are a
 * super-admin, is decided at the data layer on every request, not here.
 * Middleware alone is never the authorisation boundary.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(STAFF_COOKIE)?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, getSecretKey());
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
