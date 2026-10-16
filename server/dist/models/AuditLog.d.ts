import mongoose, { Document } from 'mongoose';
export interface IAuditLog extends Document {
    userId?: mongoose.Types.ObjectId;
    userRole?: string;
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: {
        before?: Record<string, any>;
        after?: Record<string, any>;
    };
    correlationId?: string;
    ipAddress?: string;
    timestamp: Date;
}
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}, {}> & IAuditLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
