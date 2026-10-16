import { describe, it, expect } from 'vitest';
import { HotelPolicyService } from '../services/policy.service';

describe('HotelPolicyService — Short-Stay Rules & Overstay Calculation', () => {
  describe('Hourly Stay Policy Validation', () => {
    it('should prohibit 1 male and 1 female in a single room for short-stay (1-3 hours)', () => {
      const result = HotelPolicyService.validateBookingPolicy({
        bookingType: 'HOURLY',
        durationHours: 2,
        numberOfRooms: 1,
        malesCount: 1,
        femalesCount: 1,
      });

      expect(result.isAllowed).toBe(false);
      expect(result.code).toBe('MIXED_GENDER_SINGLE_ROOM_HOURLY_PROHIBITED');
      expect(result.requiresSeparateRooms).toBe(true);
      expect(result.minimumRoomsRequired).toBe(2);
      expect(result.recommendation?.action).toBe('BOOK_SEPARATE_ROOMS');
    });

    it('should permit 1 male and 1 female if they book 2 separate rooms', () => {
      const result = HotelPolicyService.validateBookingPolicy({
        bookingType: 'HOURLY',
        durationHours: 2,
        numberOfRooms: 2,
        malesCount: 1,
        femalesCount: 1,
      });

      expect(result.isAllowed).toBe(true);
      expect(result.requiresSeparateRooms).toBe(false);
    });

    it('should permit 1 or 2 male guests for short-stay in a single room', () => {
      const result1 = HotelPolicyService.validateBookingPolicy({
        bookingType: 'HOURLY',
        durationHours: 3,
        numberOfRooms: 1,
        malesCount: 1,
        femalesCount: 0,
      });
      expect(result1.isAllowed).toBe(true);

      const result2 = HotelPolicyService.validateBookingPolicy({
        bookingType: 'HOURLY',
        durationHours: 2,
        numberOfRooms: 1,
        malesCount: 2,
        femalesCount: 0,
      });
      expect(result2.isAllowed).toBe(true);
    });

    it('should permit standard overnight daily bookings for couples with verification', () => {
      const result = HotelPolicyService.validateBookingPolicy({
        bookingType: 'DAILY',
        durationHours: 24,
        numberOfRooms: 1,
        malesCount: 1,
        femalesCount: 1,
      });

      expect(result.isAllowed).toBe(true);
      expect(result.requiresSeparateRooms).toBe(false);
    });
  });

  describe('Overstay Fee Calculation', () => {
    const dailyRatePaise = 300000; // ₹3,000

    it('should waive extra fee if check-out is within 1 hour grace period past 11:00 AM', () => {
      // 11:30 AM on 2026-10-16
      const checkoutTimestamp = new Date(2026, 9, 16, 11, 30, 0);
      const result = HotelPolicyService.calculateOverstay('2026-10-16', dailyRatePaise, checkoutTimestamp);

      expect(result.hasOverstay).toBe(false);
      expect(result.feePaise).toBe(0);
    });

    it('should calculate 50% half-day fee if overstay is between 1 and 6 hours', () => {
      // 3:00 PM on 2026-10-16 (4 hours past 11:00 AM)
      const checkoutTimestamp = new Date(2026, 9, 16, 15, 0, 0);
      const result = HotelPolicyService.calculateOverstay('2026-10-16', dailyRatePaise, checkoutTimestamp);

      expect(result.hasOverstay).toBe(true);
      expect(result.feePaise).toBe(150000); // ₹1,500 (50% of ₹3,000)
      expect(result.rateDescription).toContain('Half-Day Overstay');
    });

    it('should calculate full day fee if overstay exceeds 6 hours or extends into extra days', () => {
      // 8:00 PM on 2026-10-16 (9 hours past 11:00 AM)
      const checkoutTimestamp = new Date(2026, 9, 16, 20, 0, 0);
      const result = HotelPolicyService.calculateOverstay('2026-10-16', dailyRatePaise, checkoutTimestamp);

      expect(result.hasOverstay).toBe(true);
      expect(result.feePaise).toBe(300000); // ₹3,000 full extra day
      expect(result.rateDescription).toContain('Extended Stay Fee');
    });
  });
});
