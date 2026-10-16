import mongoose, { Document, Schema } from 'mongoose';

export interface IConsentRecord {
  consentType: string; // e.g. 'MARKETING', 'TERMS', 'DATA_PROCESSING'
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
}

export interface IGuestAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface IGuest extends Document {
  fullName: string;
  mobile: string;
  email: string;
  address?: IGuestAddress;
  nationality: string;
  idProofType?: string; // Aadhaar, Passport, Driving License, Voter ID
  idProofNumberMasked?: string;
  bookingReferences: string[];
  consentRecords: IConsentRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>(
  {
    fullName: {
      type: String,
      required: [true, 'Guest full name is required'],
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    nationality: {
      type: String,
      default: 'Indian',
      trim: true,
    },
    idProofType: {
      type: String,
      enum: ['Aadhaar', 'Passport', 'Driving License', 'Voter ID', 'Other'],
    },
    idProofNumberMasked: {
      type: String,
      trim: true,
    },
    bookingReferences: {
      type: [String],
      default: [],
    },
    consentRecords: [
      {
        consentType: { type: String, required: true },
        granted: { type: Boolean, required: true },
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

GuestSchema.index({ email: 1, mobile: 1 });

export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);
