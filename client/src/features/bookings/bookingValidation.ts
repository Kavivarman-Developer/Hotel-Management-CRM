import { z } from 'zod';

export const guestDetailsSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name is too long')
    .trim(),
  email: z.string().email('Please enter a valid email address').trim(),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .trim(),
  nationality: z.string().min(2, 'Nationality is required'),
  specialRequests: z.string().max(300, 'Special requests maximum 300 characters').optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the booking terms and hotel policies',
  }),
});

export type GuestDetailsFormData = z.infer<typeof guestDetailsSchema>;
