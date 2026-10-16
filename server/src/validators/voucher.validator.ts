import { z } from 'zod';

export const createVoucherSchema = z.object({
  code: z
    .string()
    .min(3, 'Voucher code must be at least 3 characters')
    .max(20, 'Voucher code maximum 20 characters')
    .regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, hyphens, and underscores')
    .transform((val) => val.toUpperCase().trim()),
  description: z.string().min(3, 'Description is required').trim(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive('Discount value must be greater than 0'),
  minBookingAmount: z.number().min(0, 'Minimum booking amount must be at least 0').default(0),
  maxDiscountAmount: z.number().min(0).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().min(1, 'Expiration date is required'),
  usageLimit: z.number().int().positive('Usage limit must be at least 1').default(500),
  isActive: z.boolean().default(true),
});

export const updateVoucherSchema = z.object({
  description: z.string().min(3).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.number().positive().optional(),
  minBookingAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional().nullable(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const validateVoucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required').transform((val) => val.toUpperCase().trim()),
  subtotal: z.number().min(0, 'Subtotal amount is required (paise)'),
});
