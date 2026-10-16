import mongoose, { Document } from 'mongoose';
export interface INotificationLog extends Document {
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
    recipient: string;
    template: string;
    status: 'QUEUED' | 'SENT' | 'FAILED';
    error?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const NotificationLog: mongoose.Model<INotificationLog, {}, {}, {}, mongoose.Document<unknown, {}, INotificationLog, {}, {}> & INotificationLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
