import mongoose, { Document, Schema } from 'mongoose';

export interface IRefund extends Document {
  refundReference: string;
  bookingId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  amount: number; // in integer paise
  currency: string;
  reason: string;
  providerStatus: string;
  providerRefundId?: string;
  authorizedUser: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    refundReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    providerStatus: {
      type: String,
      default: 'PENDING',
    },
    providerRefundId: {
      type: String,
    },
    authorizedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Refund = mongoose.model<IRefund>('Refund', RefundSchema);
