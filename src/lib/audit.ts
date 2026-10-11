import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export type AuditAction =
  | "ORDER_STATUS_CHANGED"
  | "SETTLEMENT_VALIDATED"
  | "STOCK_OPNAME_CLOSED"
  | "PRICE_BELOW_HPP"
  | "ACCOUNT_CREATED"
  | "ACCOUNT_UPDATED"
  | "ACCOUNT_DELETED";

/**
 * Log a sensitive admin action. Never throws — audit failure must not block business ops.
 */
export async function logAudit(
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId,
      action,
      entityType,
      entityId,
      detail: detail ?? null,
    });
  } catch {
    // intentionally silent
  }
}
