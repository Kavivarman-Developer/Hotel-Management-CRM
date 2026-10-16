import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be YYYY-MM-DD'),
  guests: z.coerce.number().int().positive('guests must be a positive integer'),
  rooms: z.coerce.number().int().positive('rooms must be a positive integer').default(1),
  roomTypeId: z.string().optional(),
  discountCode: z.string().optional(),
});
