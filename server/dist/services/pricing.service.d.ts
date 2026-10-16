import { IRatePlan } from '../models/RatePlan';
import { IRoomType } from '../models/RoomType';
import { PricingCalculationResult } from '../types';
export declare class PricingService {
    /**
     * Generates an array of date strings (YYYY-MM-DD) for each night of the stay.
     * Check-out date is exclusive.
     * e.g. checkIn: 2026-10-20, checkOut: 2026-10-22 -> ['2026-10-20', '2026-10-21']
     */
    static getStayNights(checkInDate: string, checkOutDate: string): string[];
    /**
     * Calculates authoritative server-side pricing for a room type and date range.
     */
    static calculatePricing(ratePlan: IRatePlan, roomType: IRoomType, checkInDate: string, checkOutDate: string, numberOfGuests?: number, discountCode?: string, voucher?: {
        code: string;
        discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
        discountValue: number;
        maxDiscountAmount?: number;
        minBookingAmount?: number;
    } | null): PricingCalculationResult;
}
