"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectExtraStaySchema = exports.approveExtraStaySchema = exports.createExtraStaySchema = void 0;
const zod_1 = require("zod");
exports.createExtraStaySchema = zod_1.z.object({
    bookingReference: zod_1.z.string().min(1, 'Booking reference is required').trim().toUpperCase(),
    requestedExtraHours: zod_1.z
        .number()
        .int('Extra hours must be an integer')
        .min(1, 'Must request at least 1 extra hour')
        .max(24, 'Maximum 24 hours extension per request'),
    reason: zod_1.z.string().min(3, 'Please provide a reason for the extra stay extension (min 3 chars)').trim(),
});
exports.approveExtraStaySchema = zod_1.z.object({
    addToFolio: zod_1.z.boolean().default(true),
    staffNotes: zod_1.z.string().optional(),
});
exports.rejectExtraStaySchema = zod_1.z.object({
    rejectionReason: zod_1.z.string().min(3, 'Rejection reason is required (min 3 chars)').trim(),
});
//# sourceMappingURL=extraStay.validator.js.map