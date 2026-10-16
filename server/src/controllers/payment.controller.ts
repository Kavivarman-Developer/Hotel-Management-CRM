import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { Payment } from '../models/Payment';
import { sendSuccess } from '../utils/response';

export class PaymentController {
  public static async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId } = req.body;
      const idempotencyKey = req.header('Idempotency-Key');

      const result = await PaymentService.createPaymentOrder(bookingId, idempotencyKey);
      sendSuccess(res, result, 'Payment order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-payment-signature'] as string;
      const rawPayload = JSON.stringify(req.body);

      const payment = await PaymentService.processWebhook(rawPayload, signature, req.body);
      sendSuccess(res, { paymentId: payment._id, status: payment.paymentStatus }, 'Webhook processed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async adminListPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const total = await Payment.countDocuments();
      const payments = await Payment.find()
        .populate('bookingId', 'bookingReference totalAmount checkInDate checkOutDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      sendSuccess(res, payments, 'Payments retrieved', 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async adminRefundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { amount, reason } = req.body;

      const refund = await PaymentService.processRefund(id, amount, reason, req.user!.id);
      sendSuccess(res, refund, 'Payment refund processed and recorded', 200);
    } catch (error) {
      next(error);
    }
  }
}
