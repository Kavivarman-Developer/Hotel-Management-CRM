import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomType extends Document {
  name: string;
  code: string;
  description: string;
  tagline?: string;
  category: string;
  maxOccupancy: {
    adults: number;
    children: number;
    total: number;
  };
  bedConfiguration: string;
  amenities: string[];
  features: string[];
  images: string[];
  baseRate: number; // in integer paise (e.g. 220000 = ₹2,200)
  defaultNightlyRate: number; // in integer paise (e.g. 179900 = ₹1,799)
  sizeSqFt?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>(
  {
    name: {
      type: String,
      required: [true, 'Room type name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Room type code is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    tagline: {
      type: String,
    },
    category: {
      type: String,
      required: true,
      default: 'deluxe',
    },
    maxOccupancy: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 1 },
    },
    bedConfiguration: {
      type: String,
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    baseRate: {
      type: Number,
      required: true,
      min: 0,
    },
    defaultNightlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    sizeSqFt: {
      type: Number,
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

export const RoomType = mongoose.model<IRoomType>('RoomType', RoomTypeSchema);
