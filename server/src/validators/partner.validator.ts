import { z } from 'zod';
import { env } from '../config/env';
import { PartnerListingStatus, PartnerApprovalStatus } from '../types';

const urlValidator = z.string().url().refine((url) => {
  if (env.NODE_ENV === 'production') {
    return url.startsWith('https://');
  }
  return url.startsWith('http://') || url.startsWith('https://');
}, {
  message: 'External URLs must use HTTPS in production',
});

export const createPartnerSchema = z.object({
  hotelName: z.string().min(2).trim(),
  description: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  contactInformation: z.object({
    phone: z.string().min(5),
    email: z.string().email(),
  }),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  officialWebsiteUrl: urlValidator,
  externalBookingUrl: urlValidator,
  listingStatus: z.enum([PartnerListingStatus.DRAFT, PartnerListingStatus.ACTIVE, PartnerListingStatus.INACTIVE]).default(PartnerListingStatus.ACTIVE),
  approvalStatus: z.enum([PartnerApprovalStatus.PENDING, PartnerApprovalStatus.APPROVED, PartnerApprovalStatus.REJECTED]).default(PartnerApprovalStatus.APPROVED),
});

export const updatePartnerSchema = createPartnerSchema.partial();
