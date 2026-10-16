import mongoose, { Document } from 'mongoose';
import { RegistrationStatus } from '../types';
export interface ISecureDocRef {
    docType: string;
    fileKey: string;
    fileName: string;
    mimeType: string;
    uploadedAt: Date;
}
export interface IGuestRegistration extends Document {
    bookingId?: mongoose.Types.ObjectId;
    walkInReference?: string;
    guestId: mongoose.Types.ObjectId;
    registrationDetails: {
        primaryGuest: {
            fullName: string;
            phone: string;
            email: string;
            nationality: string;
            idProofType: string;
            idProofNumberMasked: string;
        };
        additionalGuests?: Array<{
            name: string;
            age: number;
            relation: string;
        }>;
        vehicleNumber?: string;
        estimatedArrivalTime?: string;
        emergencyContact?: {
            name: string;
            phone: string;
            relationship: string;
        };
        specialRequests?: string;
    };
    verificationStatus: RegistrationStatus;
    consentRecords: Array<{
        consentType: string;
        granted: boolean;
        timestamp: Date;
    }>;
    secureDocumentReferences: ISecureDocRef[];
    reviewedBy?: mongoose.Types.ObjectId;
    reviewNotes?: string;
    submittedAt?: Date;
    verifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const GuestRegistration: mongoose.Model<IGuestRegistration, {}, {}, {}, mongoose.Document<unknown, {}, IGuestRegistration, {}, {}> & IGuestRegistration & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
