import { z } from 'zod';
export declare const checkInSchema: z.ZodObject<{
    roomId: z.ZodOptional<z.ZodString>;
    bypassRegistrationCheck: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    bypassRegistrationCheck: boolean;
    roomId?: string | undefined;
    notes?: string | undefined;
}, {
    roomId?: string | undefined;
    notes?: string | undefined;
    bypassRegistrationCheck?: boolean | undefined;
}>;
export declare const checkOutSchema: z.ZodObject<{
    additionalCharges: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        amount: z.ZodNumber;
        category: z.ZodEnum<["MINI_BAR", "ROOM_SERVICE", "LAUNDRY", "DAMAGE", "OTHER"]>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        category: "MINI_BAR" | "ROOM_SERVICE" | "LAUNDRY" | "DAMAGE" | "OTHER";
        amount: number;
    }, {
        description: string;
        category: "MINI_BAR" | "ROOM_SERVICE" | "LAUNDRY" | "DAMAGE" | "OTHER";
        amount: number;
    }>, "many">>;
    finalPaidAmount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    additionalCharges?: {
        description: string;
        category: "MINI_BAR" | "ROOM_SERVICE" | "LAUNDRY" | "DAMAGE" | "OTHER";
        amount: number;
    }[] | undefined;
    finalPaidAmount?: number | undefined;
}, {
    notes?: string | undefined;
    additionalCharges?: {
        description: string;
        category: "MINI_BAR" | "ROOM_SERVICE" | "LAUNDRY" | "DAMAGE" | "OTHER";
        amount: number;
    }[] | undefined;
    finalPaidAmount?: number | undefined;
}>;
