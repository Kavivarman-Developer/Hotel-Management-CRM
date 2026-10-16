import { z } from 'zod';

export const createExtraStaySchema = z.object({
  bookingReference: z.string().min(1, 'Booking reference is required').trim().toUpperCase(),
  requestedExtraHours: z
    .number()
    .int('Extra hours must be an integer')
    .min(1, 'Must request at least 1 extra hour')
    .max(24, 'Maximum 24 hours extension per request'),
  reason: z.string().min(3, 'Please provide a reason for the extra stay extension (min 3 chars)').trim(),
});

export const approveExtraStaySchema = z.object({
  addToFolio: z.boolean().default(true),
  staffNotes: z.string().optional(),
});

export const rejectExtraStaySchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason is required (min 3 chars)').trim(),
});
