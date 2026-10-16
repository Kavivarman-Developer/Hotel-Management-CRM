import { z } from 'zod';
export declare const updatePropertySettingsSchema: z.ZodObject<{
    propertyName: z.ZodOptional<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    checkInTime: z.ZodOptional<z.ZodString>;
    checkOutTime: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    holdDurationMinutes: z.ZodOptional<z.ZodNumber>;
    defaultGstPercentage: z.ZodOptional<z.ZodNumber>;
    cancellationGraceHours: z.ZodOptional<z.ZodNumber>;
    allowSameDayBooking: z.ZodOptional<z.ZodBoolean>;
    extraStayHourlyRatePaise: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    tagline?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    pincode?: string | undefined;
    country?: string | undefined;
    phone?: string | undefined;
    propertyName?: string | undefined;
    checkInTime?: string | undefined;
    checkOutTime?: string | undefined;
    timezone?: string | undefined;
    holdDurationMinutes?: number | undefined;
    defaultGstPercentage?: number | undefined;
    cancellationGraceHours?: number | undefined;
    allowSameDayBooking?: boolean | undefined;
    extraStayHourlyRatePaise?: number | undefined;
}, {
    email?: string | undefined;
    tagline?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    pincode?: string | undefined;
    country?: string | undefined;
    phone?: string | undefined;
    propertyName?: string | undefined;
    checkInTime?: string | undefined;
    checkOutTime?: string | undefined;
    timezone?: string | undefined;
    holdDurationMinutes?: number | undefined;
    defaultGstPercentage?: number | undefined;
    cancellationGraceHours?: number | undefined;
    allowSameDayBooking?: boolean | undefined;
    extraStayHourlyRatePaise?: number | undefined;
}>;
export declare const updateRolePermissionsSchema: z.ZodObject<{
    permissions: z.ZodArray<z.ZodEnum<z.Writeable<any>>, "many">;
    applyToExistingUsers: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    permissions: any[];
    applyToExistingUsers: boolean;
}, {
    permissions: any[];
    applyToExistingUsers?: boolean | undefined;
}>;
