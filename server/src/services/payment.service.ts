import crypto from 'crypto';
import mongoose from 'mongoose';
import { Payment, IPayment } from '../models/Payment';
import { Booking } from '../models/Booking';
import { Refund, IRefund } from '../models/Refund';
import { withTransaction } from '../config/database';
import { env } from '../config/env';
import { PaymentStatus, ReservationStatus } from '../types';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export interface PaymentOrderResult {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  isDevelopmentMode: boolean;
}

export class PaymentService {
  /**
   * Generates HMAC-SHA256 signature for webhooks
   */
  public static generateWebhookSignature(payload: string, secret: string = env.PAYMENT_WEBHOOK_SECRET): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verifies incoming webhook signature securely
   */
  public static verifyWebhookSignature(payload: string, signature: string, secret: string = env.PAYMENT_WEBHOOK_SECRET): boolean {
    if (!signature) return false;
    const expected = this.generateWebhookSignature(payload, secret);
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * Create payment order for a booking
   */
  public static async createPaymentOrder(
    bookingId: string,
    idempotencyKey?: string
  ): Promise<PaymentOrderResult> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.reservationStatus === ReservationStatus.CANCELLED) {
      throw new BadRequestError('Cannot pay for a cancelled booking');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestError('This reservation has already been paid in full');
    }

    // Check if an existing initiated payment exists with same idempotency key
    if (idempotencyKey) {
      const existing = await Payment.findOne({ idempotencyKey });
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
    const provider = env.PAYMENT_PROVIDER;

    const payment = new Payment({
      bookingId: booking._id,
      amount: booking.totalAmount,
      currency: booking.currency,
      provider,
      providerOrderId: orderId,
      paymentStatus: PaymentStatus.INITIATED,
      idempotencyKey,
    });

    await payment.save();

    await logAudit({
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
  public static async processWebhook(
    rawPayload: string,
    signature: string,
    parsedData: {
      orderId: string;
      transactionReference: string;
      status: 'SUCCESS' | 'FAILED';
      amount: number;
    }
  ): Promise<IPayment> {
    const isVerified = this.verifyWebhookSignature(rawPayload, signature);
    if (!isVerified) {
      throw new UnauthorizedError('Invalid payment webhook signature', 'INVALID_SIGNATURE');
    }

    return await withTransaction(async (session) => {
      const payment = await Payment.findOne({ providerOrderId: parsedData.orderId }).session(session);
      if (!payment) {
        throw new NotFoundError(`Payment with orderId ${parsedData.orderId} not found`);
      }

      // Idempotency: if already SUCCESS, return directly
      if (payment.paymentStatus === PaymentStatus.SUCCESS) {
        return payment;
      }

      payment.providerTransactionReference = parsedData.transactionReference;
      payment.paymentStatus = parsedData.status === 'SUCCESS' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
      payment.verifiedTimestamp = new Date();
      payment.metadata = { webhookReceivedAt: new Date() };

      await payment.save({ session });

      const booking = await Booking.findById(payment.bookingId).session(session);
      if (booking) {
        if (parsedData.status === 'SUCCESS') {
          booking.paymentStatus = PaymentStatus.PAID;
          booking.reservationStatus = ReservationStatus.CONFIRMED;
        } else {
          booking.paymentStatus = PaymentStatus.FAILED;
        }
        await booking.save({ session });
      }

      await logAudit({
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
  public static async processRefund(
    paymentId: string,
    amount: number,
    reason: string,
    authorizedUserId: string
  ): Promise<IRefund> {
    return await withTransaction(async (session) => {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) {
        throw new NotFoundError('Payment record not found');
      }

      if (payment.paymentStatus !== PaymentStatus.SUCCESS) {
        throw new BadRequestError('Only successful payments can be refunded');
      }

      if (amount <= 0 || amount > payment.amount) {
        throw new BadRequestError(`Refund amount must be between 1 and ${payment.amount} paise`);
      }

      const refundReference = `REF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      const refund = new Refund({
        refundReference,
        bookingId: payment.bookingId,
        paymentId: payment._id,
        amount,
        currency: payment.currency,
        reason,
        providerStatus: 'PROCESSED',
        providerRefundId: `DEV-REFUND-${refundReference}`,
        authorizedUser: new mongoose.Types.ObjectId(authorizedUserId),
      });

      await refund.save({ session });

      payment.paymentStatus = PaymentStatus.REFUNDED;
      await payment.save({ session });

      const booking = await Booking.findById(payment.bookingId).session(session);
      if (booking) {
        booking.paymentStatus = PaymentStatus.REFUNDED;
        await booking.save({ session });
      }

      await logAudit({
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
