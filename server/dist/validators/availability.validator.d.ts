import { z } from 'zod';
export declare const availabilityQuerySchema: z.ZodObject<{
    checkIn: z.ZodString;
    checkOut: z.ZodString;
    guests: z.ZodNumber;
    rooms: z.ZodDefault<z.ZodNumber>;
    roomTypeId: z.ZodOptional<z.ZodString>;
    discountCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
    discountCode?: string | undefined;
    roomTypeId?: string | undefined;
}, {
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms?: number | undefined;
    discountCode?: string | undefined;
    roomTypeId?: string | undefined;
}>;
