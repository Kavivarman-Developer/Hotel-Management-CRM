import { z } from 'zod';
import { UserRole, ALL_PERMISSIONS } from '../types';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Valid email is required').trim(),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits').trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.FRONT_DESK]),
  permissions: z.array(z.enum(ALL_PERMISSIONS as any)).optional(),
});

export const updatePermissionsSchema = z.object({
  permissions: z.array(z.enum(ALL_PERMISSIONS as any)),
});

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean(),
});
