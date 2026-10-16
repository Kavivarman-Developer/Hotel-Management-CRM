"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOutSchema = exports.checkInSchema = void 0;
const zod_1 = require("zod");
exports.checkInSchema = zod_1.z.object({
    roomId: zod_1.z.string().optional(),
    bypassRegistrationCheck: zod_1.z.boolean().optional().default(false),
    notes: zod_1.z.string().optional(),
});
exports.checkOutSchema = zod_1.z.object({
    additionalCharges: zod_1.z
        .array(zod_1.z.object({
        description: zod_1.z.string().min(1),
        amount: zod_1.z.number().int().min(0), // in paise
        category: zod_1.z.enum(['MINI_BAR', 'ROOM_SERVICE', 'LAUNDRY', 'DAMAGE', 'OTHER']),
    }))
        .optional(),
    finalPaidAmount: zod_1.z.number().int().min(0).optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=stay.validator.js.map