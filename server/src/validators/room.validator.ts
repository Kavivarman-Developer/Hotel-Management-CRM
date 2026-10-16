import { z } from 'zod';
import { RoomStatus, HousekeepingStatus } from '../types';

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').trim().toUpperCase(),
  roomTypeId: z.string().min(1, 'Room type ID is required'),
  floor: z.number().int().default(1),
  maxGuests: z.number().int().positive('maxGuests must be positive'),
  amenities: z.array(z.string()).optional().default([]),
  status: z.enum([RoomStatus.ACTIVE, RoomStatus.INACTIVE, RoomStatus.MAINTENANCE]).default(RoomStatus.ACTIVE),
  housekeepingStatus: z
    .enum([HousekeepingStatus.CLEAN, HousekeepingStatus.DIRTY, HousekeepingStatus.INSPECTED, HousekeepingStatus.OUT_OF_SERVICE])
    .default(HousekeepingStatus.CLEAN),
});

export const updateRoomSchema = createRoomSchema.partial();

export const maintenanceBlockSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  reason: z.string().min(3, 'Maintenance reason is required'),
});

export const createRoomTypeSchema = z.object({
  name: z.string().min(2).trim(),
  code: z.string().min(2).trim().toLowerCase(),
  description: z.string().min(10),
  tagline: z.string().optional(),
  category: z.string().default('deluxe'),
  maxOccupancy: z.object({
    adults: z.number().int().min(1),
    children: z.number().int().min(0).default(0),
    total: z.number().int().min(1),
  }),
  bedConfiguration: z.string(),
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  baseRate: z.number().int().positive(), // in paise
  defaultNightlyRate: z.number().int().positive(), // in paise
  sizeSqFt: z.number().optional(),
});
