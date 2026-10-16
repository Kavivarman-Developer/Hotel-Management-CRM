import mongoose, { Document, Schema } from 'mongoose';
import { RegistrationStatus } from '../types';

export interface ISecureDocRef {
  docType: string; // Aadhaar, Passport, DL, etc.
  fileKey: string; // secure storage identifier / path
  fileName: string;
  mimeType: string;
  uploadedAt: Date;
}

export interface IGuestRegistration extends Document {
  bookingId?: mongoose.Types.ObjectId;
  walkInReference?: string;
  guestId: mongoose.Types.ObjectId;
  registrationDetails: {
    primaryGuest: {
      fullName: string;
      phone: string;
      email: string;
      nationality: string;
      idProofType: string;
      idProofNumberMasked: string;
    };
    additionalGuests?: Array<{
      name: string;
      age: number;
      relation: string;
    }>;
    vehicleNumber?: string;
    estimatedArrivalTime?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    specialRequests?: string;
  };
  verificationStatus: RegistrationStatus;
  consentRecords: Array<{
    consentType: string;
    granted: boolean;
    timestamp: Date;
  }>;
  secureDocumentReferences: ISecureDocRef[];
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SecureDocRefSchema = new Schema<ISecureDocRef>(
  {
    docType: { type: String, required: true },
    fileKey: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const GuestRegistrationSchema = new Schema<IGuestRegistration>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: false,
      index: {
        unique: true,
        partialFilterExpression: { bookingId: { $type: 'objectId' } },
      },
    },
    walkInReference: {
      type: String,
      sparse: true,
      index: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
      required: true,
      index: true,
    },
    registrationDetails: {
      type: {
        primaryGuest: {
          fullName: { type: String, required: true },
          phone: { type: String, required: true },
          email: { type: String, required: true },
          nationality: { type: String, default: 'Indian' },
          idProofType: { type: String, required: true },
          idProofNumberMasked: { type: String, required: true },
        },
        additionalGuests: [
          {
            name: { type: String, required: true },
            age: { type: Number, required: true },
            relation: { type: String, required: true },
          },
        ],
        vehicleNumber: { type: String },
        estimatedArrivalTime: { type: String },
        emergencyContact: {
          name: { type: String },
          phone: { type: String },
          relationship: { type: String },
        },
        specialRequests: { type: String },
      },
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.PENDING,
      index: true,
    },
    consentRecords: [
      {
        consentType: { type: String, required: true },
        granted: { type: Boolean, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    secureDocumentReferences: {
      type: [SecureDocRefSchema],
      default: [],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const GuestRegistration = mongoose.model<IGuestRegistration>('GuestRegistration', GuestRegistrationSchema);
