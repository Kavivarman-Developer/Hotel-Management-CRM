import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomInventoryLock extends Document {
  roomId: mongoose.Types.ObjectId;
  version: number;
  lastLockedAt: Date;
  lockedByOperation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomInventoryLockSchema = new Schema<IRoomInventoryLock>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      unique: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    lastLockedAt: {
      type: Date,
      default: Date.now,
    },
    lockedByOperation: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const RoomInventoryLock = mongoose.model<IRoomInventoryLock>('RoomInventoryLock', RoomInventoryLockSchema);
