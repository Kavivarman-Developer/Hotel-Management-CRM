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
  durationHours?: number; // e.g. 1, 2, 3, 6
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

export class HotelPolicyService {
  /**
   * Evaluates Grand OMR Residency booking policy for hourly & short stay bookings
   */
  public static validateBookingPolicy(input: PolicyCheckInput): PolicyCheckResult {
    const {
      bookingType = 'DAILY',
      durationHours = 24,
      numberOfRooms = 1,
      malesCount = 0,
      femalesCount = 0,
    } = input;

    // Daily / Overnight stays are permitted under standard verification
    if (bookingType === 'DAILY') {
      return {
        isAllowed: true,
        ruleTitle: 'Standard Overnight Policy',
        message: 'Standard overnight reservations are allowed with valid government photo ID verification at reception.',
        requiresSeparateRooms: false,
        minimumRoomsRequired: numberOfRooms,
      };
    }

    // Hourly / Short-Stay Rules (1 to 3 hours)
    if (bookingType === 'HOURLY' && durationHours <= 4) {
      const isMixedGender = malesCount >= 1 && femalesCount >= 1;

      // Condition: Boy and girl in a single room for short-stay (1-3 hrs)
      if (isMixedGender && numberOfRooms < 2) {
        return {
          isAllowed: false,
          code: 'MIXED_GENDER_SINGLE_ROOM_HOURLY_PROHIBITED',
          ruleTitle: 'Hotel Policy: Short-Stay Room Allocation Restriction',
          message:
            'Per GRAND OMR RESIDENCY regulations, short-stay / hourly bookings (1-3 hours) for male and female guests in a single room are strictly prohibited. Single room hourly accommodation is available for individual guests or male business/transit travelers (1 or 2 boys).',
          requiresSeparateRooms: true,
          minimumRoomsRequired: 2,
          recommendation: {
            action: 'BOOK_SEPARATE_ROOMS',
            requiredRoomsCount: 2,
            explanation:
              'Both guests can be accommodated if they book two separate individual rooms (subject to room availability), or by booking a standard 24-hour overnight stay with full government ID registration.',
          },
        };
      }

      // If they booked 2 or more separate rooms, it is compliant!
      if (isMixedGender && numberOfRooms >= 2) {
        return {
          isAllowed: true,
          ruleTitle: 'Separate Rooms Policy Compliant',
          message:
            'Separate room allocation for male and female guests for short-stay has been verified and complies with hotel regulations.',
          requiresSeparateRooms: false,
          minimumRoomsRequired: 2,
        };
      }

      // 1 or 2 males in a single room: Allowed
      if (malesCount > 0 && femalesCount === 0) {
        return {
          isAllowed: true,
          ruleTitle: 'Male Short-Stay Compliant',
          message:
            'Short-stay booking for male guests complies with hotel transit regulations.',
          requiresSeparateRooms: false,
          minimumRoomsRequired: 1,
        };
      }

      // 1 or 2 females in a single room: Allowed
      if (femalesCount > 0 && malesCount === 0) {
        return {
          isAllowed: true,
          ruleTitle: 'Female Short-Stay Compliant',
          message:
            'Short-stay booking for female guests complies with hotel transit regulations.',
          requiresSeparateRooms: false,
          minimumRoomsRequired: 1,
        };
      }
    }

    // Default compliant
    return {
      isAllowed: true,
      ruleTitle: 'Policy Compliant',
      message: 'Booking details comply with property guidelines.',
      requiresSeparateRooms: false,
      minimumRoomsRequired: numberOfRooms,
    };
  }

  /**
   * Calculates overstay charges based on actual checkout timestamp vs scheduled checkout
   */
  public static calculateOverstay(
    scheduledCheckOutDate: string,
    dailyNightRatePaise: number,
    actualCheckOutTimestamp: Date = new Date()
  ): {
    hasOverstay: boolean;
    hoursOverstayed: number;
    feePaise: number;
    rateDescription: string;
  } {
    // Scheduled check-out cutoff: 11:00 AM on check-out date (IST)
    const [year, month, day] = scheduledCheckOutDate.split('-').map(Number);
    const scheduledCheckOut = new Date(year, month - 1, day, 11, 0, 0);

    const diffMs = actualCheckOutTimestamp.getTime() - scheduledCheckOut.getTime();
    if (diffMs <= 0) {
      return {
        hasOverstay: false,
        hoursOverstayed: 0,
        feePaise: 0,
        rateDescription: 'Checked out on or before scheduled time (11:00 AM). No extra charges.',
      };
    }

    const diffHours = diffMs / (1000 * 60 * 60);

    // 0 to 60 mins: Grace period
    if (diffHours <= 1.0) {
      return {
        hasOverstay: false,
        hoursOverstayed: Number(diffHours.toFixed(1)),
        feePaise: 0,
        rateDescription: `Within 1-hour complimentary grace period (${diffHours.toFixed(1)} hrs past 11:00 AM). No charge.`,
      };
    }

    // 1 to 6 hours: Half-day late check-out fee (50% of daily rate)
    if (diffHours <= 6.0) {
      const halfDayFee = Math.round(dailyNightRatePaise * 0.5);
      return {
        hasOverstay: true,
        hoursOverstayed: Number(diffHours.toFixed(1)),
        feePaise: halfDayFee,
        rateDescription: `Half-Day Overstay / Late Check-Out: ${diffHours.toFixed(1)} hrs past 11:00 AM (+50% daily room rate).`,
      };
    }

    // > 6 hours: Full extra day(s) fee
    const extraDays = Math.ceil(diffHours / 24);
    const fullDayFee = dailyNightRatePaise * extraDays;
    return {
      hasOverstay: true,
      hoursOverstayed: Number(diffHours.toFixed(1)),
      feePaise: fullDayFee,
      rateDescription: `Extended Stay Fee: ${extraDays} extra night/day (${diffHours.toFixed(1)} hrs past scheduled 11:00 AM check-out).`,
    };
  }
}
