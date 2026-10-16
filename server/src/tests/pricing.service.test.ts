import { describe, it, expect } from 'vitest';
import { PricingService } from '../services/pricing.service';
import { BadRequestError } from '../utils/errors';

describe('PricingService', () => {
  const mockRoomType: any = {
    code: 'deluxe-king',
    maxOccupancy: { adults: 2, children: 1, total: 3 },
  };

  const mockRatePlan: any = {
    currency: 'INR',
    defaultRate: 179900, // ₹1,799 in paise
    extraGuestCharges: 50000, // ₹500 in paise
    weekdayWeekendRules: {
      weekendMultiplier: 1.2, // +20% on weekend
      applyOnDays: [5, 6], // Friday & Saturday
    },
    seasonalRules: [
      {
        name: 'Peak Season',
        startDate: '2026-12-20',
        endDate: '2026-12-31',
        fixedRate: 250000, // ₹2,500
      },
    ],
    dateSpecificRates: [
      {
        date: '2026-10-31',
        rate: 300000, // ₹3,000 Halloween special
      },
    ],
    discountConfiguration: [
      {
        code: 'PROMO10',
        percentage: 10,
        maxDiscountAmount: 30000, // max ₹300
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        active: true,
      },
    ],
    taxConfiguration: {
      gstPercentage: 12,
      name: 'GST',
    },
  };

  describe('getStayNights', () => {
    it('should generate exclusive stay nights between check-in and check-out', () => {
      const nights = PricingService.getStayNights('2026-10-20', '2026-10-22');
      expect(nights).toEqual(['2026-10-20', '2026-10-21']);
      expect(nights.length).toBe(2);
    });

    it('should throw BadRequestError if checkIn >= checkOut', () => {
      expect(() => PricingService.getStayNights('2026-10-22', '2026-10-20')).toThrow(BadRequestError);
      expect(() => PricingService.getStayNights('2026-10-20', '2026-10-20')).toThrow(BadRequestError);
    });
  });

  describe('calculatePricing', () => {
    it('should calculate standard default rate with 12% GST', () => {
      // 2026-10-20 (Tuesday) to 2026-10-22 (Thursday) = 2 weekday nights
      const result = PricingService.calculatePricing(
        mockRatePlan,
        mockRoomType,
        '2026-10-20',
        '2026-10-22',
        2
      );

      expect(result.nightCount).toBe(2);
      expect(result.subtotal).toBe(179900 * 2); // 359800
      expect(result.discount).toBe(0);
      expect(result.taxRatePercentage).toBe(12);
      // GST: 359800 * 0.12 = 43176 paise
      expect(result.taxes).toBe(Math.round(359800 * 0.12));
      expect(result.totalAmount).toBe(359800 + Math.round(359800 * 0.12));
    });

    it('should apply date-specific override rates', () => {
      // 2026-10-31 is overridden to 300000 paise
      const result = PricingService.calculatePricing(
        mockRatePlan,
        mockRoomType,
        '2026-10-31',
        '2026-11-01',
        2
      );

      expect(result.nightCount).toBe(1);
      expect(result.perNightBreakdown[0].effectiveRate).toBe(300000);
      expect(result.subtotal).toBe(300000);
    });

    it('should apply seasonal rules', () => {
      // Peak Season: 2026-12-24 (fixed rate 250000)
      const result = PricingService.calculatePricing(
        mockRatePlan,
        mockRoomType,
        '2026-12-24',
        '2026-12-25',
        2
      );

      expect(result.nightCount).toBe(1);
      expect(result.perNightBreakdown[0].effectiveRate).toBe(250000);
      expect(result.subtotal).toBe(250000);
    });

    it('should apply extra guest charges when guests exceed base adult capacity', () => {
      // Base adults = 2, guests = 3 -> 1 extra guest * 50000 paise/night
      const result = PricingService.calculatePricing(
        mockRatePlan,
        mockRoomType,
        '2026-10-20',
        '2026-10-21',
        3
      );

      expect(result.nightCount).toBe(1);
      expect(result.perNightBreakdown[0].extraGuestCharge).toBe(50000);
      expect(result.subtotal).toBe(179900 + 50000);
    });

    it('should apply valid discount code and respect maximum discount cap', () => {
      // Subtotal = 179900 * 2 = 359800 paise. 10% = 35980 paise. Cap = 30000 paise.
      const result = PricingService.calculatePricing(
        mockRatePlan,
        mockRoomType,
        '2026-10-20',
        '2026-10-22',
        2,
        'PROMO10'
      );

      expect(result.discountCode).toBe('PROMO10');
      expect(result.discount).toBe(30000); // capped at 30000
      const netTaxable = 359800 - 30000; // 329800
      expect(result.taxes).toBe(Math.round(netTaxable * 0.12));
      expect(result.totalAmount).toBe(netTaxable + Math.round(netTaxable * 0.12));
    });
  });
});
