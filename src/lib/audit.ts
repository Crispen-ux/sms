import { db } from "@/lib/db";

interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ip?: string;
}

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ip: entry.ip,
      },
    });
  } catch (error) {
    // Audit logging should never crash the application
    console.error("Audit log error:", error);
  }
}

export async function getAuditLogs(params: {
  resource?: string;
  resourceId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (params.resource) where.resource = params.resource;
  if (params.resourceId) where.resourceId = params.resourceId;
  if (params.userId) where.userId = params.userId;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total };
}
