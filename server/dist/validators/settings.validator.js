"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRolePermissionsSchema = exports.updatePropertySettingsSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.updatePropertySettingsSchema = zod_1.z.object({
    propertyName: zod_1.z.string().min(2).max(100).optional(),
    tagline: zod_1.z.string().max(200).optional(),
    address: zod_1.z.string().min(5).optional(),
    city: zod_1.z.string().min(2).optional(),
    state: zod_1.z.string().min(2).optional(),
    pincode: zod_1.z.string().min(4).optional(),
    country: zod_1.z.string().optional(),
    phone: zod_1.z.string().min(8).optional(),
    email: zod_1.z.string().email().optional(),
    checkInTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').optional(),
    checkOutTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').optional(),
    timezone: zod_1.z.string().optional(),
    holdDurationMinutes: zod_1.z.number().int().min(5).max(60).optional(),
    defaultGstPercentage: zod_1.z.number().min(0).max(30).optional(),
    cancellationGraceHours: zod_1.z.number().int().min(0).max(168).optional(),
    allowSameDayBooking: zod_1.z.boolean().optional(),
    extraStayHourlyRatePaise: zod_1.z.number().int().min(0).optional(),
});
exports.updateRolePermissionsSchema = zod_1.z.object({
    permissions: zod_1.z.array(zod_1.z.enum(types_1.ALL_PERMISSIONS)),
    applyToExistingUsers: zod_1.z.boolean().default(true),
});
//# sourceMappingURL=settings.validator.js.map