import { IGuestRegistration } from '../models/GuestRegistration';
export interface SubmitRegistrationInput {
    primaryGuest: {
        fullName: string;
        phone: string;
        email: string;
        nationality: string;
        idProofType: string;
        idProofNumber: string;
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
    consentGranted: boolean;
}
export interface SubmitWalkInRegistrationInput {
    primaryGuest: {
        fullName: string;
        phone: string;
        email: string;
        nationality?: string;
        idProofType: string;
        idProofNumber: string;
    };
    stayRequirements?: {
        stayType?: 'DAILY' | 'HOURLY';
        durationHours?: number;
        numberOfRooms?: number;
        malesCount?: number;
        femalesCount?: number;
    };
    additionalGuests?: Array<{
        name: string;
        age: number;
        relation: string;
    }>;
    vehicleNumber?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    specialRequests?: string;
    consentGranted: boolean;
}
export declare class QrService {
    /**
     * Masks sensitive ID proof numbers (e.g. Aadhaar, Passport)
     */
    static maskIdNumber(idNumber: string): string;
    /**
     * Hashes token with SHA-256
     */
    static hashToken(token: string): string;
    /**
     * Validates a QR / digital check-in token without exposing full PII.
     */
    static validateToken(token: string): Promise<any>;
    /**
     * Submit registration information through QR link.
     * Does NOT check in the guest!
     */
    static submitRegistration(token: string, input: SubmitRegistrationInput): Promise<IGuestRegistration>;
    /**
     * Staff approval of registration.
     */
    static approveRegistration(registrationId: string, staffUserId: string, notes?: string): Promise<IGuestRegistration>;
    /**
     * Staff rejection of registration.
     */
    static rejectRegistration(registrationId: string, staffUserId: string, reason: string): Promise<IGuestRegistration>;
    /**
     * Submit walk-in digital registration at the hotel front desk via counter QR code
     */
    static submitWalkInRegistration(input: SubmitWalkInRegistrationInput): Promise<any>;
    /**
     * Staff reissue / renewal of QR token.
     */
    static reissueQrToken(bookingId: string, staffUserId: string): Promise<{
        rawToken: string;
        expiresAt: Date;
    }>;
}
