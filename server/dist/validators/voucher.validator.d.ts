import { z } from 'zod';
export declare const createVoucherSchema: z.ZodObject<{
    code: z.ZodEffects<z.ZodString, string, string>;
    description: z.ZodString;
    discountType: z.ZodEnum<["PERCENTAGE", "FIXED_AMOUNT"]>;
    discountValue: z.ZodNumber;
    minBookingAmount: z.ZodDefault<z.ZodNumber>;
    maxDiscountAmount: z.ZodOptional<z.ZodNumber>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodString;
    usageLimit: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    isActive: boolean;
    description: string;
    minBookingAmount: number;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    validUntil: string;
    usageLimit: number;
    maxDiscountAmount?: number | undefined;
    validFrom?: string | undefined;
}, {
    code: string;
    description: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    validUntil: string;
    isActive?: boolean | undefined;
    maxDiscountAmount?: number | undefined;
    validFrom?: string | undefined;
    minBookingAmount?: number | undefined;
    usageLimit?: number | undefined;
}>;
export declare const updateVoucherSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    discountType: z.ZodOptional<z.ZodEnum<["PERCENTAGE", "FIXED_AMOUNT"]>>;
    discountValue: z.ZodOptional<z.ZodNumber>;
    minBookingAmount: z.ZodOptional<z.ZodNumber>;
    maxDiscountAmount: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    maxDiscountAmount?: number | null | undefined;
    validFrom?: string | undefined;
    minBookingAmount?: number | undefined;
    discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
    discountValue?: number | undefined;
    validUntil?: string | undefined;
    usageLimit?: number | undefined;
}, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    maxDiscountAmount?: number | null | undefined;
    validFrom?: string | undefined;
    minBookingAmount?: number | undefined;
    discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | undefined;
    discountValue?: number | undefined;
    validUntil?: string | undefined;
    usageLimit?: number | undefined;
}>;
export declare const validateVoucherSchema: z.ZodObject<{
    code: z.ZodEffects<z.ZodString, string, string>;
    subtotal: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    code: string;
    subtotal: number;
}, {
    code: string;
    subtotal: number;
}>;
