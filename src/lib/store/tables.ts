import { sql } from "@/lib/db/sql";
import { signTableToken, verifyTableToken } from "@/lib/table-token";
import type { DiningTable } from "@/lib/types";

export async function listTables(): Promise<DiningTable[]> {
  return sql<DiningTable[]>`select * from dining_tables order by table_number`;
}

export async function getTableById(id: string): Promise<DiningTable | undefined> {
  const [row] = await sql<DiningTable[]>`select * from dining_tables where id = ${id}`;
  return row;
}

export async function getTableByNumber(tableNumber: number): Promise<DiningTable | undefined> {
  const [row] = await sql<DiningTable[]>`select * from dining_tables where table_number = ${tableNumber}`;
  return row;
}

/**
 * Resolves a scanned QR token to its table. Verifies the HMAC rather than
 * trusting the value, and refuses inactive tables — a table pulled out of
 * service should not accept orders just because an old sticker survives.
 */
export async function resolveTableByToken(qrToken: string): Promise<DiningTable | undefined> {
  const [table] = await sql<DiningTable[]>`
    select * from dining_tables where qr_token = ${qrToken} and is_active
  `;
  if (!table) return undefined;
  if (!verifyTableToken(table.tableNumber, qrToken)) return undefined;
  return table;
}

export async function addTable(tableNumber: number): Promise<DiningTable> {
  const [row] = await sql<DiningTable[]>`
    insert into dining_tables (id, table_number, qr_token, is_active)
    values (${`table-${tableNumber}`}, ${tableNumber}, ${signTableToken(tableNumber)}, true)
    on conflict (table_number) do nothing
    returning *
  `;
  // The unique constraint, not a prior read, is what makes this safe against
  // two admins adding the same table at once.
  if (!row) throw new Error(`Table ${tableNumber} already exists.`);
  return row;
}

export async function setTableActive(id: string, isActive: boolean): Promise<DiningTable | undefined> {
  const [row] = await sql<DiningTable[]>`
    update dining_tables set is_active = ${isActive} where id = ${id} returning *
  `;
  return row;
}
