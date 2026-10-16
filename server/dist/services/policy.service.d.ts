/**
 * GRAND OMR RESIDENCY — Property Rules & Hotel Policy Engine
 *
 * Implements hotel compliance checks:
 * 1. Hourly Short-Stay (1-3 hours) mixed-gender restriction:
 *    - Boy and girl are NOT permitted in a single room for 1-3 hours short-stay.
 *    - 1 or 2 male guests ARE permitted for short-stay (transit/business rest).
 *    - If a male and female require hourly accommodation, they MUST book separate rooms
 *      (checking availability for 2 rooms) or book a standard overnight stay with ID verification.
 * 2. Overstay calculation rules:
 *    - Checkout cutoff: 11:00 AM IST
 *    - 0-60 mins: Grace period (₹0)
 *    - 1-6 hours: Late checkout / half-day fee (50% daily rate)
 *    - >6 hours: Full extra day fee (100% daily rate per day)
 */
export interface PolicyCheckInput {
    bookingType?: 'DAILY' | 'HOURLY';
    durationHours?: number;
    numberOfRooms: number;
    malesCount: number;
    femalesCount: number;
    maritalStatusDeclared?: 'MARRIED' | 'UNMARRIED' | 'NOT_SPECIFIED';
}
export interface PolicyCheckResult {
    isAllowed: boolean;
    code?: 'MIXED_GENDER_SINGLE_ROOM_HOURLY_PROHIBITED' | 'SEPARATE_ROOMS_REQUIRED';
    ruleTitle: string;
    message: string;
    requiresSeparateRooms: boolean;
    minimumRoomsRequired: number;
    recommendation?: {
        action: 'BOOK_SEPARATE_ROOMS' | 'SWITCH_TO_DAILY_STAY';
        requiredRoomsCount: number;
        explanation: string;
    };
}
export declare class HotelPolicyService {
    /**
     * Evaluates Grand OMR Residency booking policy for hourly & short stay bookings
     */
    static validateBookingPolicy(input: PolicyCheckInput): PolicyCheckResult;
    /**
     * Calculates overstay charges based on actual checkout timestamp vs scheduled checkout
     */
    static calculateOverstay(scheduledCheckOutDate: string, dailyNightRatePaise: number, actualCheckOutTimestamp?: Date): {
        hasOverstay: boolean;
        hoursOverstayed: number;
        feePaise: number;
        rateDescription: string;
    };
}
