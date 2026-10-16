import { z } from 'zod';

export const qrValidateParamSchema = z.object({
  token: z.string().min(16, 'Invalid token length'),
});

export const guestRegistrationSchema = z.object({
  primaryGuest: z.object({
    fullName: z.string().min(2, 'Full name is required').trim(),
    phone: z.string().min(10, 'Valid phone number is required').trim(),
    email: z.string().email('Valid email is required').trim(),
    nationality: z.string().default('Indian'),
    idProofType: z.enum(['Aadhaar', 'Passport', 'Driving License', 'Voter ID', 'Other']),
    idProofNumber: z.string().min(4, 'ID proof number is required').trim(),
  }),
  additionalGuests: z
    .array(
      z.object({
        name: z.string().min(1, 'Guest name is required'),
        age: z.number().int().min(0),
        relation: z.string().min(1, 'Relation is required'),
      })
    )
    .optional(),
  vehicleNumber: z.string().optional(),
  estimatedArrivalTime: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
  specialRequests: z.string().optional(),
  consentGranted: z.boolean().refine((val) => val === true, 'Consent must be granted'),
});

export const reviewRegistrationSchema = z.object({
  notes: z.string().optional(),
  reason: z.string().optional(),
});
