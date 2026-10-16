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
export declare const logAudit: (params: AuditParams) => Promise<void>;
export {};
