import mongoose, { Document, Schema } from 'mongoose';
import { RoomStatus, HousekeepingStatus } from '../types';

export interface IMaintenanceBlock {
  _id?: mongoose.Types.ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  blockedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
}

export interface IRoom extends Document {
  roomNumber: string;
  roomTypeId: mongoose.Types.ObjectId;
  floor: number;
  maxGuests: number;
  amenities: string[];
  status: RoomStatus;
  housekeepingStatus: HousekeepingStatus;
  maintenanceInfo: IMaintenanceBlock[];
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceBlockSchema = new Schema<IMaintenanceBlock>(
  {
    startDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'],
    },
    endDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'],
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const RoomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Room type reference is required'],
      index: true,
    },
    floor: {
      type: Number,
      default: 1,
    },
    maxGuests: {
      type: Number,
      required: [true, 'Maximum guests is required'],
      min: 1,
    },
    amenities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.ACTIVE,
      index: true,
    },
    housekeepingStatus: {
      type: String,
      enum: Object.values(HousekeepingStatus),
      default: HousekeepingStatus.CLEAN,
      index: true,
    },
    maintenanceInfo: {
      type: [MaintenanceBlockSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

RoomSchema.index({ roomTypeId: 1, status: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
