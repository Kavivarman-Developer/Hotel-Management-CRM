import mongoose, { Document } from 'mongoose';
export type ExtraStayStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ExtraStayPaymentStatus = 'PENDING' | 'ADDED_TO_FOLIO' | 'PAID';
export interface IExtraStayRequest extends Document {
    bookingId: mongoose.Types.ObjectId;
    stayId?: mongoose.Types.ObjectId;
    bookingReference: string;
    guestName: string;
    guestMobile: string;
    roomNumber: string;
    currentCheckOutDate: string;
    currentCheckOutTime: string;
    requestedExtraHours: number;
    newExpectedCheckOutTime: string;
    reason: string;
    hourlyRatePaise: number;
    chargeAmountPaise: number;
    status: ExtraStayStatus;
    paymentStatus: ExtraStayPaymentStatus;
    staffNotes?: string;
    rejectionReason?: string;
    actionedBy?: mongoose.Types.ObjectId;
    actionedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ExtraStayRequest: mongoose.Model<IExtraStayRequest, {}, {}, {}, mongoose.Document<unknown, {}, IExtraStayRequest, {}, {}> & IExtraStayRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
