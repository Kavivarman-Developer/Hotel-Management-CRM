import mongoose, { Document } from 'mongoose';
export interface IPropertySettings extends Document {
    propertyName: string;
    tagline: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
    email: string;
    checkInTime: string;
    checkOutTime: string;
    timezone: string;
    holdDurationMinutes: number;
    defaultGstPercentage: number;
    cancellationGraceHours: number;
    allowSameDayBooking: boolean;
    extraStayHourlyRatePaise: number;
    rolePermissions?: Record<string, string[]>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PropertySettings: mongoose.Model<IPropertySettings, {}, {}, {}, mongoose.Document<unknown, {}, IPropertySettings, {}, {}> & IPropertySettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
