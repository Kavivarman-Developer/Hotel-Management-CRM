import { AuditLog } from '../models/AuditLog';
import { Request } from 'express';

interface AuditParams {
  req?: Request;
  actor?: string;
  userId?: any;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

const sanitizeChanges = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'refreshTokenHash',
    'idProofNumber',
    'secret',
    'cvv',
    'cardNumber',
  ];

  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      clone[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object') {
      clone[key] = sanitizeChanges(clone[key]);
    }
  }
  return clone;
};

export const logAudit = async (params: AuditParams): Promise<void> => {
  try {
    const actor = params.actor || params.req?.user?.email || (params.req?.user ? 'STAFF' : 'GUEST');
    const userId = params.userId || params.req?.user?.id;
    const userRole = params.userRole || params.req?.user?.role;
    const correlationId = params.req?.correlationId;
    const ipAddress = params.req?.ip;

    await AuditLog.create({
      userId,
      userRole,
      actor,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      correlationId,
      ipAddress,
      changes: {
        before: sanitizeChanges(params.changes?.before),
        after: sanitizeChanges(params.changes?.after),
      },
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('[AuditLog] Failed to record audit log:', error.message);
  }
};
