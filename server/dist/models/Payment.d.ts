import mongoose, { Document } from 'mongoose';
import { PaymentStatus } from '../types';
export interface IPayment extends Document {
    bookingId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    provider: 'DEVELOPMENT_ADAPTER' | 'RAZORPAY' | 'STRIPE' | 'CASH' | 'UPI';
    providerTransactionReference?: string;
    providerOrderId?: string;
    paymentStatus: PaymentStatus;
    idempotencyKey?: string;
    verifiedTimestamp?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
