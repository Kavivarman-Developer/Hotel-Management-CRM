import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
});

export const refundPaymentSchema = z.object({
  amount: z.number().int().positive('Refund amount must be a positive integer in paise'),
  reason: z.string().min(3, 'Refund reason is required'),
});

export const webhookPayloadSchema = z.object({
  orderId: z.string().min(1),
  transactionReference: z.string().min(1),
  status: z.enum(['SUCCESS', 'FAILED']),
  amount: z.number().int().positive(),
});
