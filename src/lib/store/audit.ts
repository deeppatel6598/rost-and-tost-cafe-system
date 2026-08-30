import { generateId } from "@/lib/format";
import { db } from "@/lib/store/db";
import type { AuditLog } from "@/lib/types";

/**
 * Four competing businesses share this system and disputes will happen, so
 * every money-touching action is recorded: payment confirmations, refunds,
 * cancellations, price changes and UPI VPA changes.
 */
export function recordAudit(entry: {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}): AuditLog {
  const log: AuditLog = {
    id: generateId("audit"),
    actorId: entry.actorId,
    actorName: entry.actorName,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    beforeJson: entry.before ?? null,
    afterJson: entry.after ?? null,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.push(log);
  return log;
}

export function listAudit(limit = 200): AuditLog[] {
  return [...db.auditLogs].reverse().slice(0, limit);
}

export function listAuditForEntity(entityType: string, entityId: string): AuditLog[] {
  return db.auditLogs.filter((l) => l.entityType === entityType && l.entityId === entityId).reverse();
}
