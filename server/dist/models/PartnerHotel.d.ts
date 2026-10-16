import mongoose, { Document } from 'mongoose';
import { PartnerListingStatus, PartnerApprovalStatus } from '../types';
export interface IPartnerHotel extends Document {
    hotelName: string;
    description: string;
    address: string;
    city: string;
    contactInformation: {
        phone: string;
        email: string;
    };
    images: string[];
    amenities: string[];
    officialWebsiteUrl: string;
    externalBookingUrl: string;
    listingStatus: PartnerListingStatus;
    approvalStatus: PartnerApprovalStatus;
    approvedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PartnerHotel: mongoose.Model<IPartnerHotel, {}, {}, {}, mongoose.Document<unknown, {}, IPartnerHotel, {}, {}> & IPartnerHotel & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
