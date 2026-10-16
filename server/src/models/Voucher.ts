import mongoose, { Document, Schema } from 'mongoose';

export type VoucherDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface IVoucher extends Document {
  code: string;
  description: string;
  discountType: VoucherDiscountType;
  discountValue: number; // percentage (e.g. 10 for 10%) or fixed amount in paise (e.g. 50000 for ₹500)
  minBookingAmount: number; // in integer paise (e.g. 100000 for ₹1000)
  maxDiscountAmount?: number; // optional maximum cap in paise (e.g. 150000 for ₹1500)
  validFrom: Date;
  validUntil: Date;
  usageLimit: number; // total number of redemptions permitted
  timesUsed: number; // total redemptions so far
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: [true, 'Voucher code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
      required: true,
      default: 'PERCENTAGE',
    },
    discountValue: {
      type: Number,
      required: true,
      min: [1, 'Discount value must be at least 1'],
    },
    minBookingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 500,
      min: 1,
    },
    timesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

VoucherSchema.index({ code: 1, isActive: 1 });

export const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);
