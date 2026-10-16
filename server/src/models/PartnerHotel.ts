import mongoose, { Document, Schema } from 'mongoose';
import { PartnerListingStatus, PartnerApprovalStatus } from '../types';

export interface IPartnerHotel extends Document {
  hotelName: string;
  description: string;
  address: string;
  city: string;
  contactInformation: {
    phone: string;
    email: string;
  };
  images: string[];
  amenities: string[];
  officialWebsiteUrl: string;
  externalBookingUrl: string;
  listingStatus: PartnerListingStatus;
  approvalStatus: PartnerApprovalStatus;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerHotelSchema = new Schema<IPartnerHotel>(
  {
    hotelName: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    contactInformation: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    officialWebsiteUrl: {
      type: String,
      required: true,
      trim: true,
    },
    externalBookingUrl: {
      type: String,
      required: true,
      trim: true,
    },
    listingStatus: {
      type: String,
      enum: Object.values(PartnerListingStatus),
      default: PartnerListingStatus.ACTIVE,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(PartnerApprovalStatus),
      default: PartnerApprovalStatus.APPROVED,
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

PartnerHotelSchema.index({ listingStatus: 1, approvalStatus: 1 });

export const PartnerHotel = mongoose.model<IPartnerHotel>('PartnerHotel', PartnerHotelSchema);
