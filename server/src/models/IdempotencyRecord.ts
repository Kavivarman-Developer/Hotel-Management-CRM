import mongoose, { Document, Schema } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  idempotencyKey: string;
  endpoint: string;
  requestHash: string;
  responseStatus: number;
  responseBody: any;
  expiresAt: Date;
  createdAt: Date;
}

const IdempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestHash: {
      type: String,
      required: true,
    },
    responseStatus: {
      type: Number,
      required: true,
    },
    responseBody: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const IdempotencyRecord = mongoose.model<IIdempotencyRecord>('IdempotencyRecord', IdempotencyRecordSchema);
