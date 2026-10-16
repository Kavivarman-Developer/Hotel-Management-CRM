"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const Payment_1 = require("../models/Payment");
const Booking_1 = require("../models/Booking");
const Refund_1 = require("../models/Refund");
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
class PaymentService {
    /**
     * Generates HMAC-SHA256 signature for webhooks
     */
    static generateWebhookSignature(payload, secret = env_1.env.PAYMENT_WEBHOOK_SECRET) {
        return crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex');
    }
    /**
     * Verifies incoming webhook signature securely
     */
    static verifyWebhookSignature(payload, signature, secret = env_1.env.PAYMENT_WEBHOOK_SECRET) {
        if (!signature)
            return false;
        const expected = this.generateWebhookSignature(payload, secret);
        try {
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        }
        catch {
            return false;
        }
    }
    /**
     * Create payment order for a booking
     */
    static async createPaymentOrder(bookingId, idempotencyKey) {
        const booking = await Booking_1.Booking.findById(bookingId);
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        if (booking.reservationStatus === types_1.ReservationStatus.CANCELLED) {
            throw new errors_1.BadRequestError('Cannot pay for a cancelled booking');
        }
        if (booking.paymentStatus === types_1.PaymentStatus.PAID) {
            throw new errors_1.BadRequestError('This reservation has already been paid in full');
        }
        // Check if an existing initiated payment exists with same idempotency key
        if (idempotencyKey) {
            const existing = await Payment_1.Payment.findOne({ idempotencyKey });
            if (existing) {
                return {
                    paymentId: existing._id.toString(),
                    orderId: existing.providerOrderId || `DEV-ORDER-${existing._id}`,
                    amount: existing.amount,
                    currency: existing.currency,
                    provider: existing.provider,
                    isDevelopmentMode: existing.provider === 'DEVELOPMENT_ADAPTER',
                };
            }
        }
        const orderId = `ORDER-${booking.bookingReference}-${Date.now()}`;
        const provider = env_1.env.PAYMENT_PROVIDER;
        const payment = new Payment_1.Payment({
            bookingId: booking._id,
            amount: booking.totalAmount,
            currency: booking.currency,
            provider,
            providerOrderId: orderId,
            paymentStatus: types_1.PaymentStatus.INITIATED,
            idempotencyKey,
        });
        await payment.save();
        await (0, audit_1.logAudit)({
            action: 'PAYMENT_INITIATED',
            entityType: 'Payment',
            entityId: payment._id.toString(),
            changes: {
                after: {
                    bookingReference: booking.bookingReference,
                    amount: booking.totalAmount,
                    provider,
                    orderId,
                },
            },
        });
        return {
            paymentId: payment._id.toString(),
            orderId,
            amount: booking.totalAmount,
            currency: booking.currency,
            provider,
            isDevelopmentMode: provider === 'DEVELOPMENT_ADAPTER',
        };
    }
    /**
     * Process webhook confirmation idempotently
     */
    static async processWebhook(rawPayload, signature, parsedData) {
        const isVerified = this.verifyWebhookSignature(rawPayload, signature);
        if (!isVerified) {
            throw new errors_1.UnauthorizedError('Invalid payment webhook signature', 'INVALID_SIGNATURE');
        }
        return await (0, database_1.withTransaction)(async (session) => {
            const payment = await Payment_1.Payment.findOne({ providerOrderId: parsedData.orderId }).session(session);
            if (!payment) {
                throw new errors_1.NotFoundError(`Payment with orderId ${parsedData.orderId} not found`);
            }
            // Idempotency: if already SUCCESS, return directly
            if (payment.paymentStatus === types_1.PaymentStatus.SUCCESS) {
                return payment;
            }
            payment.providerTransactionReference = parsedData.transactionReference;
            payment.paymentStatus = parsedData.status === 'SUCCESS' ? types_1.PaymentStatus.SUCCESS : types_1.PaymentStatus.FAILED;
            payment.verifiedTimestamp = new Date();
            payment.metadata = { webhookReceivedAt: new Date() };
            await payment.save({ session });
            const booking = await Booking_1.Booking.findById(payment.bookingId).session(session);
            if (booking) {
                if (parsedData.status === 'SUCCESS') {
                    booking.paymentStatus = types_1.PaymentStatus.PAID;
                    booking.reservationStatus = types_1.ReservationStatus.CONFIRMED;
                }
                else {
                    booking.paymentStatus = types_1.PaymentStatus.FAILED;
                }
                await booking.save({ session });
            }
            await (0, audit_1.logAudit)({
                action: parsedData.status === 'SUCCESS' ? 'PAYMENT_VERIFIED_SUCCESS' : 'PAYMENT_FAILED',
                entityType: 'Payment',
                entityId: payment._id.toString(),
                changes: {
                    after: {
                        transactionReference: parsedData.transactionReference,
                        status: payment.paymentStatus,
                    },
                },
            });
            return payment;
        });
    }
    /**
     * Process refund with audit log
     */
    static async processRefund(paymentId, amount, reason, authorizedUserId) {
        return await (0, database_1.withTransaction)(async (session) => {
            const payment = await Payment_1.Payment.findById(paymentId).session(session);
            if (!payment) {
                throw new errors_1.NotFoundError('Payment record not found');
            }
            if (payment.paymentStatus !== types_1.PaymentStatus.SUCCESS) {
                throw new errors_1.BadRequestError('Only successful payments can be refunded');
            }
            if (amount <= 0 || amount > payment.amount) {
                throw new errors_1.BadRequestError(`Refund amount must be between 1 and ${payment.amount} paise`);
            }
            const refundReference = `REF-${Date.now().toString(36).toUpperCase()}-${crypto_1.default.randomBytes(2).toString('hex').toUpperCase()}`;
            const refund = new Refund_1.Refund({
                refundReference,
                bookingId: payment.bookingId,
                paymentId: payment._id,
                amount,
                currency: payment.currency,
                reason,
                providerStatus: 'PROCESSED',
                providerRefundId: `DEV-REFUND-${refundReference}`,
                authorizedUser: new mongoose_1.default.Types.ObjectId(authorizedUserId),
            });
            await refund.save({ session });
            payment.paymentStatus = types_1.PaymentStatus.REFUNDED;
            await payment.save({ session });
            const booking = await Booking_1.Booking.findById(payment.bookingId).session(session);
            if (booking) {
                booking.paymentStatus = types_1.PaymentStatus.REFUNDED;
                await booking.save({ session });
            }
            await (0, audit_1.logAudit)({
                action: 'PAYMENT_REFUNDED',
                entityType: 'Refund',
                entityId: refund._id.toString(),
                userId: authorizedUserId,
                changes: {
                    after: {
                        refundReference,
                        amount,
                        reason,
                        paymentId: payment._id,
                    },
                },
            });
            return refund;
        });
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map