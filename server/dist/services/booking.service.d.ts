import { IBooking } from '../models/Booking';
import { IRoomHold } from '../models/RoomHold';
import { BookingSource } from '../types';
export interface CreateHoldInput {
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    discountCode?: string;
    idempotencyKey?: string;
    specificRoomId?: string;
}
export interface CreateBookingInput {
    holdId?: string;
    holdToken?: string;
    roomTypeId?: string;
    specificRoomId?: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    numberOfRooms?: number;
    discountCode?: string;
    bookingType?: 'DAILY' | 'HOURLY';
    durationHours?: number;
    guestComposition?: {
        males: number;
        females: number;
    };
    guest: {
        fullName: string;
        email: string;
        mobile: string;
        nationality?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            pincode?: string;
            country?: string;
        };
    };
    source?: BookingSource;
    specialRequests?: string;
    idempotencyKey?: string;
    createdBy?: string;
    immediatePayment?: {
        provider: 'DEVELOPMENT_ADAPTER' | 'RAZORPAY' | 'STRIPE' | 'CASH' | 'UPI';
        transactionReference?: string;
    };
}
export declare class BookingService {
    /**
     * Generates a human-friendly unique booking reference: GOR-YYYYMMDD-XXXX
     */
    static generateBookingReference(date?: Date): string;
    /**
     * Generates a cryptographically secure token and its SHA-256 hash.
     */
    static generateSecureToken(): {
        rawToken: string;
        hashedToken: string;
    };
    /**
     * Hashes a raw token for lookup.
     */
    static hashToken(rawToken: string): string;
    /**
     * Step 1: Create a temporary room hold with full concurrency control.
     */
    static createHold(input: CreateHoldInput): Promise<{
        hold: IRoomHold;
        holdToken: string;
        expiresAt: Date;
        pricing: any;
    }>;
    /**
     * Step 2: Create or confirm a booking atomically inside transaction.
     * Concurrency protected via RoomInventoryLock.
     */
    static createBooking(input: CreateBookingInput): Promise<{
        booking: IBooking;
        qrToken: string;
        pricing: any;
    }>;
    /**
     * Cancel booking enforcing cancellation rules and auditing.
     */
    static cancelBooking(referenceOrId: string, reason: string, cancelledByUserId?: string, isAdmin?: boolean): Promise<IBooking>;
    /**
     * Lookup booking by reference with guest verification to prevent unauthorized data access.
     */
    static getBookingByReference(reference: string, guestVerification?: {
        email?: string;
        mobile?: string;
    }, isStaff?: boolean): Promise<any>;
}
