import mongoose, { Document } from 'mongoose';
export interface IAdditionalCharge {
    _id?: mongoose.Types.ObjectId;
    description: string;
    amount: number;
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
    finalPaidAmount?: number;
    stayStatus: 'ACTIVE' | 'COMPLETED';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const StayRecord: mongoose.Model<IStayRecord, {}, {}, {}, mongoose.Document<unknown, {}, IStayRecord, {}, {}> & IStayRecord & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
