"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingVerificationQuerySchema = exports.cancelBookingSchema = exports.createBookingSchema = exports.createHoldSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.createHoldSchema = zod_1.z.object({
    roomTypeId: zod_1.z.string().min(1, 'roomTypeId is required'),
    checkInDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD'),
    checkOutDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD'),
    numberOfGuests: zod_1.z.number().int().positive('numberOfGuests must be a positive integer'),
    discountCode: zod_1.z.string().optional(),
    specificRoomId: zod_1.z.string().optional(),
});
exports.createBookingSchema = zod_1.z.object({
    holdId: zod_1.z.string().optional(),
    holdToken: zod_1.z.string().optional(),
    roomTypeId: zod_1.z.string().optional(),
    specificRoomId: zod_1.z.string().optional(),
    checkInDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD'),
    checkOutDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD'),
    numberOfGuests: zod_1.z.number().int().positive(),
    numberOfRooms: zod_1.z.number().int().positive().default(1),
    discountCode: zod_1.z.string().optional(),
    bookingType: zod_1.z.enum(['DAILY', 'HOURLY']).default('DAILY').optional(),
    durationHours: zod_1.z.number().int().min(1).max(24).optional(),
    guestComposition: zod_1.z
        .object({
        males: zod_1.z.number().int().min(0).default(1),
        females: zod_1.z.number().int().min(0).default(0),
    })
        .optional(),
    guest: zod_1.z.object({
        fullName: zod_1.z.string().min(2, 'Full name is required').trim(),
        email: zod_1.z.string().email('Valid email is required').trim(),
        mobile: zod_1.z.string().min(10, 'Valid mobile number is required').trim(),
        nationality: zod_1.z.string().default('Indian'),
        address: zod_1.z
            .object({
            street: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            pincode: zod_1.z.string().optional(),
            country: zod_1.z.string().default('India'),
        })
            .optional(),
    }),
    source: zod_1.z.enum([
        types_1.BookingSource.WEBSITE,
        types_1.BookingSource.FRONT_DESK,
        types_1.BookingSource.ADMIN,
        types_1.BookingSource.WALK_IN,
        types_1.BookingSource.PARTNER_OTA,
    ]).default(types_1.BookingSource.WEBSITE),
    specialRequests: zod_1.z.string().optional(),
});
exports.cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3, 'Cancellation reason is required (min 3 characters)').trim(),
});
exports.getBookingVerificationQuerySchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    mobile: zod_1.z.string().optional(),
});
//# sourceMappingURL=booking.validator.js.map