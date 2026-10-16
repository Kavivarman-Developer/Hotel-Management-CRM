import { z } from 'zod';
import { BookingSource } from '../types';

export const createHoldSchema = z.object({
  roomTypeId: z.string().min(1, 'roomTypeId is required'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD'),
  numberOfGuests: z.number().int().positive('numberOfGuests must be a positive integer'),
  discountCode: z.string().optional(),
  specificRoomId: z.string().optional(),
});

export const createBookingSchema = z.object({
  holdId: z.string().optional(),
  holdToken: z.string().optional(),
  roomTypeId: z.string().optional(),
  specificRoomId: z.string().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD'),
  numberOfGuests: z.number().int().positive(),
  numberOfRooms: z.number().int().positive().default(1),
  discountCode: z.string().optional(),
  bookingType: z.enum(['DAILY', 'HOURLY']).default('DAILY').optional(),
  durationHours: z.number().int().min(1).max(24).optional(),
  guestComposition: z
    .object({
      males: z.number().int().min(0).default(1),
      females: z.number().int().min(0).default(0),
    })
    .optional(),
  guest: z.object({
    fullName: z.string().min(2, 'Full name is required').trim(),
    email: z.string().email('Valid email is required').trim(),
    mobile: z.string().min(10, 'Valid mobile number is required').trim(),
    nationality: z.string().default('Indian'),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        country: z.string().default('India'),
      })
      .optional(),
  }),
  source: z.enum([
    BookingSource.WEBSITE,
    BookingSource.FRONT_DESK,
    BookingSource.ADMIN,
    BookingSource.WALK_IN,
    BookingSource.PARTNER_OTA,
  ]).default(BookingSource.WEBSITE),
  specialRequests: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required (min 3 characters)').trim(),
});

export const getBookingVerificationQuerySchema = z.object({
  email: z.string().email().optional(),
  mobile: z.string().optional(),
});
