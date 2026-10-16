"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityQuerySchema = void 0;
const zod_1 = require("zod");
exports.availabilityQuerySchema = zod_1.z.object({
    checkIn: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be YYYY-MM-DD'),
    checkOut: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be YYYY-MM-DD'),
    guests: zod_1.z.coerce.number().int().positive('guests must be a positive integer'),
    rooms: zod_1.z.coerce.number().int().positive('rooms must be a positive integer').default(1),
    roomTypeId: zod_1.z.string().optional(),
    discountCode: zod_1.z.string().optional(),
});
//# sourceMappingURL=availability.validator.js.map