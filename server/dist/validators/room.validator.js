"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomTypeSchema = exports.maintenanceBlockSchema = exports.updateRoomSchema = exports.createRoomSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.createRoomSchema = zod_1.z.object({
    roomNumber: zod_1.z.string().min(1, 'Room number is required').trim().toUpperCase(),
    roomTypeId: zod_1.z.string().min(1, 'Room type ID is required'),
    floor: zod_1.z.number().int().default(1),
    maxGuests: zod_1.z.number().int().positive('maxGuests must be positive'),
    amenities: zod_1.z.array(zod_1.z.string()).optional().default([]),
    status: zod_1.z.enum([types_1.RoomStatus.ACTIVE, types_1.RoomStatus.INACTIVE, types_1.RoomStatus.MAINTENANCE]).default(types_1.RoomStatus.ACTIVE),
    housekeepingStatus: zod_1.z
        .enum([types_1.HousekeepingStatus.CLEAN, types_1.HousekeepingStatus.DIRTY, types_1.HousekeepingStatus.INSPECTED, types_1.HousekeepingStatus.OUT_OF_SERVICE])
        .default(types_1.HousekeepingStatus.CLEAN),
});
exports.updateRoomSchema = exports.createRoomSchema.partial();
exports.maintenanceBlockSchema = zod_1.z.object({
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
    reason: zod_1.z.string().min(3, 'Maintenance reason is required'),
});
exports.createRoomTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).trim(),
    code: zod_1.z.string().min(2).trim().toLowerCase(),
    description: zod_1.z.string().min(10),
    tagline: zod_1.z.string().optional(),
    category: zod_1.z.string().default('deluxe'),
    maxOccupancy: zod_1.z.object({
        adults: zod_1.z.number().int().min(1),
        children: zod_1.z.number().int().min(0).default(0),
        total: zod_1.z.number().int().min(1),
    }),
    bedConfiguration: zod_1.z.string(),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    features: zod_1.z.array(zod_1.z.string()).default([]),
    images: zod_1.z.array(zod_1.z.string()).default([]),
    baseRate: zod_1.z.number().int().positive(), // in paise
    defaultNightlyRate: zod_1.z.number().int().positive(), // in paise
    sizeSqFt: zod_1.z.number().optional(),
});
//# sourceMappingURL=room.validator.js.map