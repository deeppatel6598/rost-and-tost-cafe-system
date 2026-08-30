import { db } from "@/lib/store/db";
import { signTableToken, verifyTableToken } from "@/lib/table-token";
import type { DiningTable } from "@/lib/types";

export function listTables(): DiningTable[] {
  return [...db.tables].sort((a, b) => a.tableNumber - b.tableNumber);
}

export function getTableById(id: string): DiningTable | undefined {
  return db.tables.find((t) => t.id === id);
}

export function getTableByNumber(tableNumber: number): DiningTable | undefined {
  return db.tables.find((t) => t.tableNumber === tableNumber);
}

/**
 * Resolves a scanned QR token to its table. Verifies the HMAC rather than
 * trusting the value, and refuses inactive tables — a table pulled out of
 * service should not accept orders just because an old sticker survives.
 */
export function resolveTableByToken(qrToken: string): DiningTable | undefined {
  const table = db.tables.find((t) => t.qrToken === qrToken);
  if (!table || !table.isActive) return undefined;
  if (!verifyTableToken(table.tableNumber, qrToken)) return undefined;
  return table;
}

export function addTable(tableNumber: number): DiningTable {
  if (db.tables.some((t) => t.tableNumber === tableNumber)) {
    throw new Error(`Table ${tableNumber} already exists.`);
  }
  const table: DiningTable = {
    id: `table-${tableNumber}`,
    tableNumber,
    qrToken: signTableToken(tableNumber),
    isActive: true,
  };
  db.tables.push(table);
  return table;
}

export function setTableActive(id: string, isActive: boolean): DiningTable | undefined {
  const table = db.tables.find((t) => t.id === id);
  if (!table) return undefined;
  table.isActive = isActive;
  return table;
}
