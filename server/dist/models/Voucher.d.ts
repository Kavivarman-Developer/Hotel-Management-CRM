import mongoose, { Document } from 'mongoose';
export type VoucherDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export interface IVoucher extends Document {
    code: string;
    description: string;
    discountType: VoucherDiscountType;
    discountValue: number;
    minBookingAmount: number;
    maxDiscountAmount?: number;
    validFrom: Date;
    validUntil: Date;
    usageLimit: number;
    timesUsed: number;
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Voucher: mongoose.Model<IVoucher, {}, {}, {}, mongoose.Document<unknown, {}, IVoucher, {}, {}> & IVoucher & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
