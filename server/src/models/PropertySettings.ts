import mongoose, { Document, Schema } from 'mongoose';

export interface IPropertySettings extends Document {
  propertyName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  checkInTime: string; // e.g. "14:00"
  checkOutTime: string; // e.g. "11:00"
  timezone: string; // e.g. "Asia/Kolkata"
  holdDurationMinutes: number; // default 15 mins
  defaultGstPercentage: number; // default 12%
  cancellationGraceHours: number; // default 24
  allowSameDayBooking: boolean;
  extraStayHourlyRatePaise: number; // default 20000 (Rs 200/hr)
  rolePermissions?: Record<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySettingsSchema = new Schema<IPropertySettings>(
  {
    propertyName: {
      type: String,
      default: 'GRAND OMR RESIDENCY',
    },
    tagline: {
      type: String,
      default: 'Luxury Stay & Mobile Booking in Navalur, Chennai',
    },
    address: {
      type: String,
      default: '5, Rajiv Gandhi Salai, Sholinganallur, Navalur',
    },
    city: {
      type: String,
      default: 'Chennai',
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
    },
    pincode: {
      type: String,
      default: '600130',
    },
    country: {
      type: String,
      default: 'India',
    },
    phone: {
      type: String,
      default: '+91 8110018708',
    },
    email: {
      type: String,
      default: 'reservations@grandomrresidency.com',
    },
    checkInTime: {
      type: String,
      default: '14:00',
    },
    checkOutTime: {
      type: String,
      default: '11:00',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    holdDurationMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 60,
    },
    defaultGstPercentage: {
      type: Number,
      default: 12,
    },
    cancellationGraceHours: {
      type: Number,
      default: 24,
    },
    allowSameDayBooking: {
      type: Boolean,
      default: true,
    },
    extraStayHourlyRatePaise: {
      type: Number,
      default: 20000,
    },
    rolePermissions: {
      type: Map,
      of: [String],
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
  }
);

export const PropertySettings = mongoose.model<IPropertySettings>('PropertySettings', PropertySettingsSchema);
