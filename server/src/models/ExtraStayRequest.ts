import mongoose, { Document, Schema } from 'mongoose';

export type ExtraStayStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ExtraStayPaymentStatus = 'PENDING' | 'ADDED_TO_FOLIO' | 'PAID';

export interface IExtraStayRequest extends Document {
  bookingId: mongoose.Types.ObjectId;
  stayId?: mongoose.Types.ObjectId;
  bookingReference: string;
  guestName: string;
  guestMobile: string;
  roomNumber: string;
  currentCheckOutDate: string;
  currentCheckOutTime: string;
  requestedExtraHours: number;
  newExpectedCheckOutTime: string;
  reason: string;
  hourlyRatePaise: number;
  chargeAmountPaise: number;
  status: ExtraStayStatus;
  paymentStatus: ExtraStayPaymentStatus;
  staffNotes?: string;
  rejectionReason?: string;
  actionedBy?: mongoose.Types.ObjectId;
  actionedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExtraStayRequestSchema = new Schema<IExtraStayRequest>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    stayId: {
      type: Schema.Types.ObjectId,
      ref: 'StayRecord',
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      index: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    guestMobile: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    currentCheckOutDate: {
      type: String,
      required: true,
    },
    currentCheckOutTime: {
      type: String,
      default: '11:00 AM',
    },
    requestedExtraHours: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
    },
    newExpectedCheckOutTime: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    hourlyRatePaise: {
      type: Number,
      default: 20000, // ₹200/hr
    },
    chargeAmountPaise: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'ADDED_TO_FOLIO', 'PAID'],
      default: 'PENDING',
      index: true,
    },
    staffNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    actionedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    actionedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ExtraStayRequestSchema.index({ status: 1, createdAt: -1 });

export const ExtraStayRequest = mongoose.model<IExtraStayRequest>(
  'ExtraStayRequest',
  ExtraStayRequestSchema
);
