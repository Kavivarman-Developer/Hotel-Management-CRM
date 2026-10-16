"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const Payment_1 = require("../models/Payment");
const response_1 = require("../utils/response");
class PaymentController {
    static async createPayment(req, res, next) {
        try {
            const { bookingId } = req.body;
            const idempotencyKey = req.header('Idempotency-Key');
            const result = await payment_service_1.PaymentService.createPaymentOrder(bookingId, idempotencyKey);
            (0, response_1.sendSuccess)(res, result, 'Payment order created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async webhook(req, res, next) {
        try {
            const signature = req.headers['x-payment-signature'];
            const rawPayload = JSON.stringify(req.body);
            const payment = await payment_service_1.PaymentService.processWebhook(rawPayload, signature, req.body);
            (0, response_1.sendSuccess)(res, { paymentId: payment._id, status: payment.paymentStatus }, 'Webhook processed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async adminListPayments(req, res, next) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
            const skip = (page - 1) * limit;
            const total = await Payment_1.Payment.countDocuments();
            const payments = await Payment_1.Payment.find()
                .populate('bookingId', 'bookingReference totalAmount checkInDate checkOutDate')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            (0, response_1.sendSuccess)(res, payments, 'Payments retrieved', 200, {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async adminRefundPayment(req, res, next) {
        try {
            const id = req.params.id;
            const { amount, reason } = req.body;
            const refund = await payment_service_1.PaymentService.processRefund(id, amount, reason, req.user.id);
            (0, response_1.sendSuccess)(res, refund, 'Payment refund processed and recorded', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=payment.controller.js.map