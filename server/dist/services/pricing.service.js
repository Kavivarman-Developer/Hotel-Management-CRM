"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const errors_1 = require("../utils/errors");
class PricingService {
    /**
     * Generates an array of date strings (YYYY-MM-DD) for each night of the stay.
     * Check-out date is exclusive.
     * e.g. checkIn: 2026-10-20, checkOut: 2026-10-22 -> ['2026-10-20', '2026-10-21']
     */
    static getStayNights(checkInDate, checkOutDate) {
        const nights = [];
        const current = new Date(`${checkInDate}T00:00:00Z`);
        const end = new Date(`${checkOutDate}T00:00:00Z`);
        if (current >= end) {
            throw new errors_1.BadRequestError('Check-in date must be before check-out date');
        }
        while (current < end) {
            nights.push(current.toISOString().split('T')[0]);
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return nights;
    }
    /**
     * Calculates authoritative server-side pricing for a room type and date range.
     */
    static calculatePricing(ratePlan, roomType, checkInDate, checkOutDate, numberOfGuests = 1, discountCode, voucher) {
        const nights = this.getStayNights(checkInDate, checkOutDate);
        const perNightBreakdown = [];
        let subtotal = 0;
        const baseAdultCapacity = roomType.maxOccupancy?.adults || 2;
        const extraGuests = Math.max(0, numberOfGuests - baseAdultCapacity);
        const extraGuestPerNightCharge = extraGuests * (ratePlan.extraGuestCharges || 0);
        for (const night of nights) {
            let nightBaseRate = ratePlan.defaultRate;
            let effectiveRate = nightBaseRate;
            // 1. Check Date-Specific Rates
            const dateOverride = ratePlan.dateSpecificRates?.find((d) => d.date === night);
            if (dateOverride) {
                effectiveRate = dateOverride.rate;
            }
            else {
                // 2. Check Seasonal Rules
                const activeSeasonalRule = ratePlan.seasonalRules?.find((rule) => night >= rule.startDate && night <= rule.endDate);
                if (activeSeasonalRule) {
                    if (activeSeasonalRule.fixedRate !== undefined) {
                        effectiveRate = activeSeasonalRule.fixedRate;
                    }
                    else if (activeSeasonalRule.multiplier !== undefined) {
                        effectiveRate = Math.round(nightBaseRate * activeSeasonalRule.multiplier);
                    }
                }
                else {
                    // 3. Check Weekend Rules
                    const nightDate = new Date(`${night}T00:00:00Z`);
                    const dayOfWeek = nightDate.getUTCDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
                    const appliesWeekend = ratePlan.weekdayWeekendRules?.applyOnDays?.includes(dayOfWeek);
                    if (appliesWeekend) {
                        if (ratePlan.weekdayWeekendRules.weekendRate !== undefined) {
                            effectiveRate = ratePlan.weekdayWeekendRules.weekendRate;
                        }
                        else if (ratePlan.weekdayWeekendRules.weekendMultiplier !== undefined) {
                            effectiveRate = Math.round(nightBaseRate * ratePlan.weekdayWeekendRules.weekendMultiplier);
                        }
                    }
                }
            }
            if (effectiveRate <= 0) {
                throw new errors_1.BadRequestError(`Invalid or missing rate for night: ${night}`);
            }
            const totalNightRate = effectiveRate + extraGuestPerNightCharge;
            subtotal += totalNightRate;
            perNightBreakdown.push({
                date: night,
                baseRate: nightBaseRate,
                effectiveRate,
                discountedRate: effectiveRate, // will be adjusted if discount applies evenly
                extraGuestCharge: extraGuestPerNightCharge,
                totalNightRate,
            });
        }
        // 4. Calculate Discount
        let discountAmount = 0;
        let appliedDiscountCode = undefined;
        if (voucher) {
            if (!voucher.minBookingAmount || subtotal >= voucher.minBookingAmount) {
                appliedDiscountCode = voucher.code;
                if (voucher.discountType === 'PERCENTAGE') {
                    const calculated = Math.round(subtotal * (voucher.discountValue / 100));
                    discountAmount = voucher.maxDiscountAmount
                        ? Math.min(calculated, voucher.maxDiscountAmount)
                        : calculated;
                }
                else {
                    discountAmount = Math.min(subtotal, voucher.discountValue);
                }
            }
        }
        else if (discountCode && ratePlan.discountConfiguration && ratePlan.discountConfiguration.length > 0) {
            const normalizedCode = discountCode.trim().toUpperCase();
            const rule = ratePlan.discountConfiguration.find((d) => d.active && d.code.toUpperCase() === normalizedCode);
            if (rule) {
                const isDateValid = (!rule.validFrom || checkInDate >= rule.validFrom) &&
                    (!rule.validTo || checkOutDate <= rule.validTo);
                if (isDateValid) {
                    appliedDiscountCode = rule.code;
                    const calculated = Math.round(subtotal * (rule.percentage / 100));
                    discountAmount = rule.maxDiscountAmount
                        ? Math.min(calculated, rule.maxDiscountAmount)
                        : calculated;
                }
            }
        }
        const netTaxableAmount = Math.max(0, subtotal - discountAmount);
        // 5. Calculate GST / Taxes
        const taxRatePercentage = ratePlan.taxConfiguration?.gstPercentage ?? 12;
        const taxes = Math.round(netTaxableAmount * (taxRatePercentage / 100));
        // 6. Additional Charges
        const additionalCharges = 0;
        // 7. Authoritative Total
        const totalAmount = netTaxableAmount + taxes + additionalCharges;
        return {
            currency: ratePlan.currency || 'INR',
            nightCount: nights.length,
            perNightBreakdown,
            subtotal,
            discount: discountAmount,
            discountCode: appliedDiscountCode,
            taxes,
            taxRatePercentage,
            additionalCharges,
            totalAmount,
        };
    }
}
exports.PricingService = PricingService;
//# sourceMappingURL=pricing.service.js.map