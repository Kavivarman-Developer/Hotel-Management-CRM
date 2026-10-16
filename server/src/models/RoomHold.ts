import mongoose, { Document, Schema } from 'mongoose';
import { HoldStatus } from '../types';

export interface IRoomHold extends Document {
  roomId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  secureTokenHash: string;
  expirationTimestamp: Date;
  status: HoldStatus;
  idempotencyKey?: string;
  guestsCount: number;
  calculatedPrice: number; // in integer paise
  convertedBookingId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoomHoldSchema = new Schema<IRoomHold>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true,
      index: true,
    },
    checkInDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'],
      index: true,
    },
    checkOutDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'],
      index: true,
    },
    secureTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expirationTimestamp: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(HoldStatus),
      default: HoldStatus.ACTIVE,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
    guestsCount: {
      type: Number,
      required: true,
      min: 1,
    },
    calculatedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    convertedBookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick hold lookup and expiry checking
RoomHoldSchema.index({ roomId: 1, status: 1, expirationTimestamp: 1, checkInDate: 1, checkOutDate: 1 });
RoomHoldSchema.index({ expirationTimestamp: 1 }, { expireAfterSeconds: 86400 }); // TTL index clean after 24h

export const RoomHold = mongoose.model<IRoomHold>('RoomHold', RoomHoldSchema);
