import mongoose, { Document, Schema } from 'mongoose';
import { PaymentStatus } from '../types';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  amount: number; // in integer paise
  currency: string;
  provider: 'DEVELOPMENT_ADAPTER' | 'RAZORPAY' | 'STRIPE' | 'CASH' | 'UPI';
  providerTransactionReference?: string;
  providerOrderId?: string;
  paymentStatus: PaymentStatus;
  idempotencyKey?: string;
  verifiedTimestamp?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    provider: {
      type: String,
      enum: ['DEVELOPMENT_ADAPTER', 'RAZORPAY', 'STRIPE', 'CASH', 'UPI'],
      required: true,
    },
    providerTransactionReference: {
      type: String,
      index: true,
    },
    providerOrderId: {
      type: String,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.INITIATED,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
    verifiedTimestamp: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
