"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVoucherSchema = exports.updateVoucherSchema = exports.createVoucherSchema = void 0;
const zod_1 = require("zod");
exports.createVoucherSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .min(3, 'Voucher code must be at least 3 characters')
        .max(20, 'Voucher code maximum 20 characters')
        .regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, hyphens, and underscores')
        .transform((val) => val.toUpperCase().trim()),
    description: zod_1.z.string().min(3, 'Description is required').trim(),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: zod_1.z.number().positive('Discount value must be greater than 0'),
    minBookingAmount: zod_1.z.number().min(0, 'Minimum booking amount must be at least 0').default(0),
    maxDiscountAmount: zod_1.z.number().min(0).optional(),
    validFrom: zod_1.z.string().optional(),
    validUntil: zod_1.z.string().min(1, 'Expiration date is required'),
    usageLimit: zod_1.z.number().int().positive('Usage limit must be at least 1').default(500),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateVoucherSchema = zod_1.z.object({
    description: zod_1.z.string().min(3).optional(),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    discountValue: zod_1.z.number().positive().optional(),
    minBookingAmount: zod_1.z.number().min(0).optional(),
    maxDiscountAmount: zod_1.z.number().min(0).optional().nullable(),
    validFrom: zod_1.z.string().optional(),
    validUntil: zod_1.z.string().optional(),
    usageLimit: zod_1.z.number().int().positive().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.validateVoucherSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Voucher code is required').transform((val) => val.toUpperCase().trim()),
    subtotal: zod_1.z.number().min(0, 'Subtotal amount is required (paise)'),
});
//# sourceMappingURL=voucher.validator.js.map