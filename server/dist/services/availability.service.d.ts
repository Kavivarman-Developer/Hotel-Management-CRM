import mongoose from 'mongoose';
export interface AvailabilitySearchParams {
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms?: number;
    roomTypeId?: string;
    discountCode?: string;
}
export interface AvailableRoomOption {
    roomType: {
        id: string;
        name: string;
        code: string;
        description: string;
        tagline?: string;
        category: string;
        bedConfiguration: string;
        maxOccupancy: {
            adults: number;
            children: number;
            total: number;
        };
        amenities: string[];
        features: string[];
        images: string[];
        sizeSqFt?: number;
    };
    availableRoomsCount: number;
    availableRoomIds: string[];
    pricing: {
        currency: string;
        nightCount: number;
        subtotal: number;
        discount: number;
        discountCode?: string;
        taxes: number;
        taxRatePercentage: number;
        additionalCharges: number;
        totalAmount: number;
        formattedTotalAmount: string;
        perNightBreakdown: Array<{
            date: string;
            baseRate: number;
            effectiveRate: number;
            discountedRate: number;
            extraGuestCharge: number;
            totalNightRate: number;
        }>;
    };
}
export declare class AvailabilityService {
    /**
     * Helper to format paise into INR string
     */
    static formatINR(paise: number): string;
    /**
     * Checks if two date ranges overlap. Checkout date is exclusive.
     * Overlap rule: existing.checkIn < requested.checkOut && existing.checkOut > requested.checkIn
     */
    static isDateOverlap(startA: string, endA: string, startB: string, endB: string): boolean;
    /**
     * Find available room types and eligible physical rooms.
     */
    static checkAvailability(params: AvailabilitySearchParams, session?: mongoose.ClientSession | null): Promise<{
        searchCriteria: {
            checkIn: string;
            checkOut: string;
            guests: number;
            rooms: number;
            roomTypeId: string | undefined;
        };
        available: boolean;
        totalAvailableRooms: number;
        roomTypes: AvailableRoomOption[];
    }>;
}
