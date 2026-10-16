"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookPayloadSchema = exports.refundPaymentSchema = exports.createPaymentOrderSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentOrderSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'bookingId is required'),
});
exports.refundPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().int().positive('Refund amount must be a positive integer in paise'),
    reason: zod_1.z.string().min(3, 'Refund reason is required'),
});
exports.webhookPayloadSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    transactionReference: zod_1.z.string().min(1),
    status: zod_1.z.enum(['SUCCESS', 'FAILED']),
    amount: zod_1.z.number().int().positive(),
});
//# sourceMappingURL=payment.validator.js.map