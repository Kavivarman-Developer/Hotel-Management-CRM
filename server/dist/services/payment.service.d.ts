import { IPayment } from '../models/Payment';
import { IRefund } from '../models/Refund';
export interface PaymentOrderResult {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    provider: string;
    isDevelopmentMode: boolean;
}
export declare class PaymentService {
    /**
     * Generates HMAC-SHA256 signature for webhooks
     */
    static generateWebhookSignature(payload: string, secret?: string): string;
    /**
     * Verifies incoming webhook signature securely
     */
    static verifyWebhookSignature(payload: string, signature: string, secret?: string): boolean;
    /**
     * Create payment order for a booking
     */
    static createPaymentOrder(bookingId: string, idempotencyKey?: string): Promise<PaymentOrderResult>;
    /**
     * Process webhook confirmation idempotently
     */
    static processWebhook(rawPayload: string, signature: string, parsedData: {
        orderId: string;
        transactionReference: string;
        status: 'SUCCESS' | 'FAILED';
        amount: number;
    }): Promise<IPayment>;
    /**
     * Process refund with audit log
     */
    static processRefund(paymentId: string, amount: number, reason: string, authorizedUserId: string): Promise<IRefund>;
}
