import mongoose, { Document } from 'mongoose';
export interface IRefund extends Document {
    refundReference: string;
    bookingId: mongoose.Types.ObjectId;
    paymentId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    reason: string;
    providerStatus: string;
    providerRefundId?: string;
    authorizedUser: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Refund: mongoose.Model<IRefund, {}, {}, {}, mongoose.Document<unknown, {}, IRefund, {}, {}> & IRefund & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
