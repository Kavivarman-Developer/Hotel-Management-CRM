import mongoose, { Document } from 'mongoose';
export interface IConsentRecord {
    consentType: string;
    granted: boolean;
    timestamp: Date;
    ipAddress?: string;
}
export interface IGuestAddress {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
}
export interface IGuest extends Document {
    fullName: string;
    mobile: string;
    email: string;
    address?: IGuestAddress;
    nationality: string;
    idProofType?: string;
    idProofNumberMasked?: string;
    bookingReferences: string[];
    consentRecords: IConsentRecord[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Guest: mongoose.Model<IGuest, {}, {}, {}, mongoose.Document<unknown, {}, IGuest, {}, {}> & IGuest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
