import { generateId } from "@/lib/format";
import { sql } from "@/lib/db/sql";
import type { AuditLog } from "@/lib/types";

/**
 * Four competing businesses share this system and disputes will happen, so
 * every money-touching action is recorded: payment confirmations, refunds,
 * cancellations, price changes and UPI VPA changes.
 */
export async function recordAudit(entry: {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}): Promise<AuditLog> {
  const [row] = await sql<AuditLog[]>`
    insert into audit_logs (id, actor_id, actor_name, action, entity_type, entity_id, before_json, after_json)
    values (
      ${generateId("audit")}, ${entry.actorId}, ${entry.actorName}, ${entry.action},
      ${entry.entityType}, ${entry.entityId},
      ${sql.json((entry.before ?? null) as never)}, ${sql.json((entry.after ?? null) as never)}
    )
    returning *
  `;
  return row;
}

export async function listAudit(limit = 200): Promise<AuditLog[]> {
  return sql<AuditLog[]>`select * from audit_logs order by created_at desc limit ${limit}`;
}

export async function listAuditForEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
  return sql<AuditLog[]>`
    select * from audit_logs
    where entity_type = ${entityType} and entity_id = ${entityId}
    order by created_at desc
  `;
}
