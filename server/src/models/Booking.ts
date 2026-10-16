import mongoose, { Document, Schema } from 'mongoose';
import { ReservationStatus, StayStatus, PaymentStatus, BookingSource, NightlyRateBreakdown } from '../types';

export interface IBooking extends Document {
  bookingReference: string;
  guestId: mongoose.Types.ObjectId;
  assignedRoomId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfGuests: number;
  numberOfRooms: number;
  reservationStatus: ReservationStatus;
  stayStatus: StayStatus;
  paymentStatus: PaymentStatus;
  nightlyPriceBreakdown: NightlyRateBreakdown[];
  subtotal: number; // in integer paise
  discount: number; // in integer paise
  discountCode?: string;
  taxes: number; // in integer paise
  taxRatePercentage: number;
  extraCharges: number; // in integer paise
  totalAmount: number; // in integer paise
  currency: string;
  source: BookingSource;
  specialRequests?: string;
  qrTokenHash?: string;
  qrTokenExpiresAt?: Date;
  holdId?: mongoose.Types.ObjectId;
  idempotencyKey?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NightlyRateBreakdownSchema = new Schema<NightlyRateBreakdown>(
  {
    date: { type: String, required: true },
    baseRate: { type: Number, required: true },
    effectiveRate: { type: Number, required: true },
    discountedRate: { type: Number, required: true },
    extraGuestCharge: { type: Number, default: 0 },
    totalNightRate: { type: Number, required: true },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest reference is required'],
      index: true,
    },
    assignedRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Assigned room reference is required'],
      index: true,
    },
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Room type reference is required'],
      index: true,
    },
    checkInDate: {
      type: String,
      required: [true, 'Check-in date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Check-in date must be YYYY-MM-DD'],
      index: true,
    },
    checkOutDate: {
      type: String,
      required: [true, 'Check-out date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Check-out date must be YYYY-MM-DD'],
      index: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    numberOfRooms: {
      type: Number,
      default: 1,
      min: 1,
    },
    reservationStatus: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.CONFIRMED,
      index: true,
    },
    stayStatus: {
      type: String,
      enum: Object.values(StayStatus),
      default: StayStatus.NOT_CHECKED_IN,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    nightlyPriceBreakdown: {
      type: [NightlyRateBreakdownSchema],
      required: true,
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountCode: {
      type: String,
      trim: true,
    },
    taxes: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRatePercentage: {
      type: Number,
      default: 12,
      min: 0,
    },
    extraCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    source: {
      type: String,
      enum: Object.values(BookingSource),
      default: BookingSource.WEBSITE,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    qrTokenHash: {
      type: String,
      index: true,
    },
    qrTokenExpiresAt: {
      type: Date,
    },
    holdId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomHold',
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Compound indexes for availability and inventory search
BookingSchema.index({ assignedRoomId: 1, reservationStatus: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ reservationStatus: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
