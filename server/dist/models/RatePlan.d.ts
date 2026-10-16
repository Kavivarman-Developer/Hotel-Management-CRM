import mongoose, { Document } from 'mongoose';
export interface IDateSpecificRate {
    date: string;
    rate: number;
    reason?: string;
}
export interface ISeasonalRule {
    name: string;
    startDate: string;
    endDate: string;
    multiplier?: number;
    fixedRate?: number;
}
export interface IDiscountRule {
    code: string;
    percentage: number;
    maxDiscountAmount?: number;
    validFrom: string;
    validTo: string;
    active: boolean;
}
export interface IRatePlan extends Document {
    roomTypeId: mongoose.Types.ObjectId;
    currency: string;
    defaultRate: number;
    dateSpecificRates: IDateSpecificRate[];
    weekdayWeekendRules: {
        weekendMultiplier?: number;
        weekendRate?: number;
        applyOnDays: number[];
    };
    seasonalRules: ISeasonalRule[];
    extraGuestCharges: number;
    discountConfiguration: IDiscountRule[];
    taxConfiguration: {
        gstPercentage: number;
        name: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RatePlan: mongoose.Model<IRatePlan, {}, {}, {}, mongoose.Document<unknown, {}, IRatePlan, {}, {}> & IRatePlan & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
