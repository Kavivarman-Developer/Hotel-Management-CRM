import mongoose, { Document, Schema } from 'mongoose';

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

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS', 'WHATSAPP'],
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      index: true,
    },
    template: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['QUEUED', 'SENT', 'FAILED'],
      default: 'SENT',
      index: true,
    },
    error: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
