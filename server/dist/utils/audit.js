"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const AuditLog_1 = require("../models/AuditLog");
const sanitizeChanges = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
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
        }
        else if (typeof clone[key] === 'object') {
            clone[key] = sanitizeChanges(clone[key]);
        }
    }
    return clone;
};
const logAudit = async (params) => {
    try {
        const actor = params.actor || params.req?.user?.email || (params.req?.user ? 'STAFF' : 'GUEST');
        const userId = params.userId || params.req?.user?.id;
        const userRole = params.userRole || params.req?.user?.role;
        const correlationId = params.req?.correlationId;
        const ipAddress = params.req?.ip;
        await AuditLog_1.AuditLog.create({
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
    }
    catch (error) {
        console.error('[AuditLog] Failed to record audit log:', error.message);
    }
};
exports.logAudit = logAudit;
//# sourceMappingURL=audit.js.map