import { z } from 'zod';

export const checkInSchema = z.object({
  roomId: z.string().optional(),
  bypassRegistrationCheck: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  additionalCharges: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: z.number().int().min(0), // in paise
        category: z.enum(['MINI_BAR', 'ROOM_SERVICE', 'LAUNDRY', 'DAMAGE', 'OTHER']),
      })
    )
    .optional(),
  finalPaidAmount: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});
