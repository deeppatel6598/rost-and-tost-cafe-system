import { generateId } from "@/lib/format";
import { db } from "@/lib/store/db";
import type { Table } from "@/lib/types";

export function listTables(): Table[] {
  return [...db.tables].sort((a, b) => a.number - b.number);
}

export function getTableByNumber(number: number): Table | undefined {
  return db.tables.find((t) => t.number === number);
}

export function addTable(number: number, label?: string): Table {
  if (db.tables.some((t) => t.number === number)) {
    throw new Error(`Table ${number} already exists.`);
  }
  const table: Table = { id: generateId("table"), number, label, status: "free" };
  db.tables.push(table);
  return table;
}

export function removeTable(id: string): boolean {
  const idx = db.tables.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  db.tables.splice(idx, 1);
  return true;
}
