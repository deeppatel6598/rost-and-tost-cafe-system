import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createTableToken,
  STAFF_COOKIE,
  TABLE_COOKIE,
  TABLE_SESSION_TTL_SECONDS,
  verifyStaffToken,
  verifyTableSessionToken,
  type StaffSession,
  type TableSession,
} from "@/lib/auth";
import { getCurrentVisitForTable, openVisit } from "@/lib/store/visits";

export async function getStaffSession(): Promise<StaffSession | null> {
  const token = cookies().get(STAFF_COOKIE)?.value;
  if (!token) return null;
  return verifyStaffToken(token);
}

export async function getTableSession(): Promise<TableSession | null> {
  const token = cookies().get(TABLE_COOKIE)?.value;
  if (!token) return null;
  return verifyTableSessionToken(token);
}

const TABLE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

/** Re-issues the seating cookie — used when a visit starts or is superseded. */
export async function setTableSessionCookie(session: TableSession): Promise<void> {
  const token = await createTableToken(session);
  cookies().set(TABLE_COOKIE, token, { ...TABLE_COOKIE_OPTIONS, maxAge: TABLE_SESSION_TTL_SECONDS });
}

export function clearTableSessionCookie(): void {
  cookies().set(TABLE_COOKIE, "", { ...TABLE_COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * The visit this request belongs to, opening one if needed.
 *
 * A cookie minted before visits existed carries no visitId, and so does a
 * session whose visit has aged out. Both are students mid-meal, so they get a
 * fresh sitting rather than an error.
 */
export async function resolveVisitId(session: TableSession): Promise<string> {
  const existing = getCurrentVisitForTable(session.visitId, session.tableId);
  if (existing) return existing.id;

  const visit = openVisit(session.tableId);
  await setTableSessionCookie({ ...session, visitId: visit.id });
  return visit.id;
}

export function unauthorized() {
  return NextResponse.json({ error: "Not signed in." }, { status: 401 });
}

export function forbidden(message = "You do not have access to that.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Resolves the acting stall for a request, enforcing tenancy.
 *
 * Stall staff are pinned to their own stall and cannot widen scope by passing
 * a different id — the `requestedStallId` argument only matters for a
 * super-admin, who legitimately reads across stalls. This is the single choke
 * point every stall-scoped route goes through, so tenancy is enforced in one
 * place rather than re-argued per handler.
 */
export type StallScope =
  | { ok: true; session: StaffSession; stallId: string }
  | { ok: false; response: NextResponse };

export async function requireStallScope(requestedStallId?: string | null): Promise<StallScope> {
  const session = await getStaffSession();
  if (!session) return { ok: false, response: unauthorized() };

  if (session.role === "super_admin") {
    if (!requestedStallId) {
      return { ok: false, response: forbidden("Choose a stall to act on.") };
    }
    return { ok: true, session, stallId: requestedStallId };
  }

  if (!session.stallId) return { ok: false, response: forbidden() };

  // A stall account asking about someone else's stall is a probe, not a typo.
  if (requestedStallId && requestedStallId !== session.stallId) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true, session, stallId: session.stallId };
}

export type SuperAdminScope =
  | { ok: true; session: StaffSession }
  | { ok: false; response: NextResponse };

export async function requireSuperAdmin(): Promise<SuperAdminScope> {
  const session = await getStaffSession();
  if (!session) return { ok: false, response: unauthorized() };
  if (session.role !== "super_admin") return { ok: false, response: forbidden() };
  return { ok: true, session };
}

/** Stall owners may change money-affecting settings; plain counter staff may not. */
export function isOwnerOrAbove(session: StaffSession): boolean {
  return session.role === "stall_owner" || session.role === "super_admin";
}

export type TableScope =
  | { ok: true; session: TableSession }
  | { ok: false; response: NextResponse };

export async function requireTableSession(): Promise<TableScope> {
  const session = await getTableSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Scan the QR code on your table to start ordering.", code: "no_table_session" },
        { status: 401 },
      ),
    };
  }
  return { ok: true, session };
}
