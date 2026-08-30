import { generateId } from "@/lib/format";
import { hashPassword, verifyPassword } from "@/lib/password";
import { db } from "@/lib/store/db";
import type { StaffRole, StaffUser } from "@/lib/types";

export function findStaffByPhone(phone: string): StaffUser | undefined {
  return db.staff.find((s) => s.phone === phone && s.isActive);
}

export function getStaff(id: string): StaffUser | undefined {
  return db.staff.find((s) => s.id === id && s.isActive);
}

export function listStaff(): StaffUser[] {
  return [...db.staff];
}

/**
 * Verifies a login. Always runs the password check, even for an unknown
 * phone number, so response timing doesn't reveal which numbers are
 * registered staff.
 */
const DUMMY_HASH = hashPassword("not-a-real-password");

export function authenticate(phone: string, password: string): StaffUser | null {
  const staff = findStaffByPhone(phone);
  const hash = staff?.passwordHash ?? DUMMY_HASH;
  const ok = verifyPassword(password, hash);
  return ok && staff ? staff : null;
}

export function createStaff(input: {
  name: string;
  phone: string;
  password: string;
  role: StaffRole;
  stallId: string | null;
}): StaffUser {
  if (db.staff.some((s) => s.phone === input.phone)) {
    throw new Error("A staff account with that phone number already exists.");
  }
  const staff: StaffUser = {
    id: generateId("staff"),
    stallId: input.role === "super_admin" ? null : input.stallId,
    name: input.name,
    phone: input.phone,
    passwordHash: hashPassword(input.password),
    role: input.role,
    isActive: true,
  };
  db.staff.push(staff);
  return staff;
}

export function setStaffActive(id: string, isActive: boolean): StaffUser | undefined {
  const staff = db.staff.find((s) => s.id === id);
  if (!staff) return undefined;
  staff.isActive = isActive;
  return staff;
}
