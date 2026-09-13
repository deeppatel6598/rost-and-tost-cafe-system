import { generateId } from "@/lib/format";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sql } from "@/lib/db/sql";
import type { StaffRole, StaffUser } from "@/lib/types";

export async function findStaffByPhone(phone: string): Promise<StaffUser | undefined> {
  const [row] = await sql<StaffUser[]>`
    select * from staff_users where phone = ${phone} and is_active
  `;
  return row;
}

export async function getStaff(id: string): Promise<StaffUser | undefined> {
  const [row] = await sql<StaffUser[]>`select * from staff_users where id = ${id} and is_active`;
  return row;
}

export async function listStaff(): Promise<StaffUser[]> {
  return sql<StaffUser[]>`select * from staff_users order by role, name`;
}

/**
 * Verifies a login. Always runs the password check, even for an unknown phone
 * number, so response timing doesn't reveal which numbers are registered
 * staff.
 */
const DUMMY_HASH = hashPassword("not-a-real-password");

export async function authenticate(phone: string, password: string): Promise<StaffUser | null> {
  const staff = await findStaffByPhone(phone);
  const hash = staff?.passwordHash ?? DUMMY_HASH;
  const ok = verifyPassword(password, hash);
  return ok && staff ? staff : null;
}

export async function createStaff(input: {
  name: string;
  phone: string;
  password: string;
  role: StaffRole;
  stallId: string | null;
}): Promise<StaffUser> {
  const [row] = await sql<StaffUser[]>`
    insert into staff_users (id, stall_id, name, phone, password_hash, role, is_active)
    values (
      ${generateId("staff")},
      ${input.role === "super_admin" ? null : input.stallId},
      ${input.name}, ${input.phone}, ${hashPassword(input.password)}, ${input.role}, true
    )
    on conflict (phone) do nothing
    returning *
  `;
  // The unique index on phone is the guarantee, not a prior read — two
  // supervisors adding the same number at once cannot both win.
  if (!row) throw new Error("A staff account with that phone number already exists.");
  return row;
}

export async function setStaffActive(id: string, isActive: boolean): Promise<StaffUser | undefined> {
  const [row] = await sql<StaffUser[]>`
    update staff_users set is_active = ${isActive} where id = ${id} returning *
  `;
  return row;
}
