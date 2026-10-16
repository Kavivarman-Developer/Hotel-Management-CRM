import mongoose, { Document } from 'mongoose';
import { ReservationStatus, StayStatus, PaymentStatus, BookingSource, NightlyRateBreakdown } from '../types';
export interface IBooking extends Document {
    bookingReference: string;
    guestId: mongoose.Types.ObjectId;
    assignedRoomId: mongoose.Types.ObjectId;
    roomTypeId: mongoose.Types.ObjectId;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    numberOfRooms: number;
    reservationStatus: ReservationStatus;
    stayStatus: StayStatus;
    paymentStatus: PaymentStatus;
    nightlyPriceBreakdown: NightlyRateBreakdown[];
    subtotal: number;
    discount: number;
    discountCode?: string;
    taxes: number;
    taxRatePercentage: number;
    extraCharges: number;
    totalAmount: number;
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
export declare const Booking: mongoose.Model<IBooking, {}, {}, {}, mongoose.Document<unknown, {}, IBooking, {}, {}> & IBooking & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
