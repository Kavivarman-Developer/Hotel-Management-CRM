import { z } from 'zod';
export declare const createPaymentOrderSchema: z.ZodObject<{
    bookingId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    bookingId: string;
}, {
    bookingId: string;
}>;
export declare const refundPaymentSchema: z.ZodObject<{
    amount: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    amount: number;
}, {
    reason: string;
    amount: number;
}>;
export declare const webhookPayloadSchema: z.ZodObject<{
    orderId: z.ZodString;
    transactionReference: z.ZodString;
    status: z.ZodEnum<["SUCCESS", "FAILED"]>;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "SUCCESS" | "FAILED";
    amount: number;
    orderId: string;
    transactionReference: string;
}, {
    status: "SUCCESS" | "FAILED";
    amount: number;
    orderId: string;
    transactionReference: string;
}>;
