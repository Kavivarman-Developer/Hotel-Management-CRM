import mongoose, { Document, Schema } from 'mongoose';

export interface IAdditionalCharge {
  _id?: mongoose.Types.ObjectId;
  description: string;
  amount: number; // in integer paise
  category: 'MINI_BAR' | 'ROOM_SERVICE' | 'LAUNDRY' | 'DAMAGE' | 'OVERSTAY' | 'OTHER';
  addedBy: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IStayRecord extends Document {
  bookingId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  actualCheckInTimestamp: Date;
  checkedInBy: mongoose.Types.ObjectId;
  actualCheckOutTimestamp?: Date;
  checkedOutBy?: mongoose.Types.ObjectId;
  additionalCharges: IAdditionalCharge[];
  finalBillReference?: string;
  finalPaidAmount?: number; // paise
  stayStatus: 'ACTIVE' | 'COMPLETED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdditionalChargeSchema = new Schema<IAdditionalCharge>(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['MINI_BAR', 'ROOM_SERVICE', 'LAUNDRY', 'DAMAGE', 'OVERSTAY', 'OTHER'],
      default: 'OTHER',
    },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const StayRecordSchema = new Schema<IStayRecord>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    actualCheckInTimestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actualCheckOutTimestamp: {
      type: Date,
    },
    checkedOutBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    additionalCharges: {
      type: [AdditionalChargeSchema],
      default: [],
    },
    finalBillReference: {
      type: String,
    },
    finalPaidAmount: {
      type: Number,
      min: 0,
    },
    stayStatus: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

StayRecordSchema.index({ stayStatus: 1, actualCheckInTimestamp: -1 });

export const StayRecord = mongoose.model<IStayRecord>('StayRecord', StayRecordSchema);
