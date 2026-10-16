import mongoose, { Document, Schema } from 'mongoose';

export interface IDateSpecificRate {
  date: string; // YYYY-MM-DD
  rate: number; // paise
  reason?: string;
}

export interface ISeasonalRule {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  multiplier?: number; // e.g. 1.25 for +25%
  fixedRate?: number; // paise
}

export interface IDiscountRule {
  code: string;
  percentage: number;
  maxDiscountAmount?: number; // paise
  validFrom: string; // YYYY-MM-DD
  validTo: string; // YYYY-MM-DD
  active: boolean;
}

export interface IRatePlan extends Document {
  roomTypeId: mongoose.Types.ObjectId;
  currency: string;
  defaultRate: number; // in paise
  dateSpecificRates: IDateSpecificRate[];
  weekdayWeekendRules: {
    weekendMultiplier?: number;
    weekendRate?: number; // fixed rate in paise
    applyOnDays: number[]; // 0 = Sunday, 5 = Friday, 6 = Saturday
  };
  seasonalRules: ISeasonalRule[];
  extraGuestCharges: number; // paise per additional guest per night
  discountConfiguration: IDiscountRule[];
  taxConfiguration: {
    gstPercentage: number;
    name: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RatePlanSchema = new Schema<IRatePlan>(
  {
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Room type is required'],
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    defaultRate: {
      type: Number,
      required: [true, 'Default rate in paise is required'],
      min: 0,
    },
    dateSpecificRates: [
      {
        date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        rate: { type: Number, required: true, min: 0 },
        reason: { type: String },
      },
    ],
    weekdayWeekendRules: {
      weekendMultiplier: { type: Number, default: 1.0 },
      weekendRate: { type: Number },
      applyOnDays: { type: [Number], default: [5, 6] }, // Friday & Saturday
    },
    seasonalRules: [
      {
        name: { type: String, required: true },
        startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        multiplier: { type: Number },
        fixedRate: { type: Number },
      },
    ],
    extraGuestCharges: {
      type: Number,
      default: 50000, // ₹500 in paise per extra guest per night
      min: 0,
    },
    discountConfiguration: [
      {
        code: { type: String, uppercase: true, trim: true },
        percentage: { type: Number, min: 0, max: 100 },
        maxDiscountAmount: { type: Number, min: 0 },
        validFrom: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
        validTo: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
        active: { type: Boolean, default: true },
      },
    ],
    taxConfiguration: {
      gstPercentage: { type: Number, default: 12, min: 0, max: 100 },
      name: { type: String, default: 'GST' },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

RatePlanSchema.index({ roomTypeId: 1, isActive: 1 });

export const RatePlan = mongoose.model<IRatePlan>('RatePlan', RatePlanSchema);
