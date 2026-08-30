import { SignJWT, jwtVerify } from "jose";
import type { StaffRole } from "@/lib/types";

export const STAFF_COOKIE = "sk_staff_session";
export const TABLE_COOKIE = "sk_table_session";

/**
 * Staff sessions are short by design. These phones get left face-up on a
 * counter all day, and whoever picks one up should not inherit the till.
 */
export const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 4;
/** A table session lasts a meal, not a day. */
export const TABLE_SESSION_TTL_SECONDS = 60 * 60 * 4;

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export interface StaffSession {
  staffId: string;
  name: string;
  role: StaffRole;
  /** null only for super_admin. */
  stallId: string | null;
}

export interface TableSession {
  tableId: string;
  tableNumber: number;
}

export async function createStaffToken(session: StaffSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STAFF_SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyStaffToken(token: string): Promise<StaffSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.staffId !== "string" || typeof payload.role !== "string") return null;
    return {
      staffId: payload.staffId,
      name: typeof payload.name === "string" ? payload.name : "",
      role: payload.role as StaffRole,
      stallId: typeof payload.stallId === "string" ? payload.stallId : null,
    };
  } catch {
    return null;
  }
}

export async function createTableToken(session: TableSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TABLE_SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyTableSessionToken(token: string): Promise<TableSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.tableId !== "string" || typeof payload.tableNumber !== "number") return null;
    return { tableId: payload.tableId, tableNumber: payload.tableNumber };
  } catch {
    return null;
  }
}
