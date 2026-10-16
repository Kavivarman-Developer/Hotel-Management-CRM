import { z } from 'zod';
export declare const createExtraStaySchema: z.ZodObject<{
    bookingReference: z.ZodString;
    requestedExtraHours: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    bookingReference: string;
    requestedExtraHours: number;
}, {
    reason: string;
    bookingReference: string;
    requestedExtraHours: number;
}>;
export declare const approveExtraStaySchema: z.ZodObject<{
    addToFolio: z.ZodDefault<z.ZodBoolean>;
    staffNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    addToFolio: boolean;
    staffNotes?: string | undefined;
}, {
    staffNotes?: string | undefined;
    addToFolio?: boolean | undefined;
}>;
export declare const rejectExtraStaySchema: z.ZodObject<{
    rejectionReason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rejectionReason: string;
}, {
    rejectionReason: string;
}>;
