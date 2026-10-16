import { z } from 'zod';
import { UserRole, ALL_PERMISSIONS } from '../types';

export const updatePropertySettingsSchema = z.object({
  propertyName: z.string().min(2).max(100).optional(),
  tagline: z.string().max(200).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  pincode: z.string().min(4).optional(),
  country: z.string().optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional(),
  checkInTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').optional(),
  checkOutTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').optional(),
  timezone: z.string().optional(),
  holdDurationMinutes: z.number().int().min(5).max(60).optional(),
  defaultGstPercentage: z.number().min(0).max(30).optional(),
  cancellationGraceHours: z.number().int().min(0).max(168).optional(),
  allowSameDayBooking: z.boolean().optional(),
  extraStayHourlyRatePaise: z.number().int().min(0).optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.enum(ALL_PERMISSIONS as any)),
  applyToExistingUsers: z.boolean().default(true),
});
