import mongoose, { Document } from 'mongoose';
import { HoldStatus } from '../types';
export interface IRoomHold extends Document {
    roomId: mongoose.Types.ObjectId;
    roomTypeId: mongoose.Types.ObjectId;
    checkInDate: string;
    checkOutDate: string;
    secureTokenHash: string;
    expirationTimestamp: Date;
    status: HoldStatus;
    idempotencyKey?: string;
    guestsCount: number;
    calculatedPrice: number;
    convertedBookingId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RoomHold: mongoose.Model<IRoomHold, {}, {}, {}, mongoose.Document<unknown, {}, IRoomHold, {}, {}> & IRoomHold & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
