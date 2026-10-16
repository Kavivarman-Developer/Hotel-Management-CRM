import { z } from 'zod';
import { BookingSource } from '../types';
export declare const createHoldSchema: z.ZodObject<{
    roomTypeId: z.ZodString;
    checkInDate: z.ZodString;
    checkOutDate: z.ZodString;
    numberOfGuests: z.ZodNumber;
    discountCode: z.ZodOptional<z.ZodString>;
    specificRoomId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    discountCode?: string | undefined;
    specificRoomId?: string | undefined;
}, {
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    discountCode?: string | undefined;
    specificRoomId?: string | undefined;
}>;
export declare const createBookingSchema: z.ZodObject<{
    holdId: z.ZodOptional<z.ZodString>;
    holdToken: z.ZodOptional<z.ZodString>;
    roomTypeId: z.ZodOptional<z.ZodString>;
    specificRoomId: z.ZodOptional<z.ZodString>;
    checkInDate: z.ZodString;
    checkOutDate: z.ZodString;
    numberOfGuests: z.ZodNumber;
    numberOfRooms: z.ZodDefault<z.ZodNumber>;
    discountCode: z.ZodOptional<z.ZodString>;
    bookingType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["DAILY", "HOURLY"]>>>;
    durationHours: z.ZodOptional<z.ZodNumber>;
    guestComposition: z.ZodOptional<z.ZodObject<{
        males: z.ZodDefault<z.ZodNumber>;
        females: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        males: number;
        females: number;
    }, {
        males?: number | undefined;
        females?: number | undefined;
    }>>;
    guest: z.ZodObject<{
        fullName: z.ZodString;
        email: z.ZodString;
        mobile: z.ZodString;
        nationality: z.ZodDefault<z.ZodString>;
        address: z.ZodOptional<z.ZodObject<{
            street: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            state: z.ZodOptional<z.ZodString>;
            pincode: z.ZodOptional<z.ZodString>;
            country: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            country: string;
            city?: string | undefined;
            state?: string | undefined;
            pincode?: string | undefined;
            street?: string | undefined;
        }, {
            city?: string | undefined;
            state?: string | undefined;
            pincode?: string | undefined;
            country?: string | undefined;
            street?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        fullName: string;
        mobile: string;
        nationality: string;
        address?: {
            country: string;
            city?: string | undefined;
            state?: string | undefined;
            pincode?: string | undefined;
            street?: string | undefined;
        } | undefined;
    }, {
        email: string;
        fullName: string;
        mobile: string;
        address?: {
            city?: string | undefined;
            state?: string | undefined;
            pincode?: string | undefined;
            country?: string | undefined;
            street?: string | undefined;
        } | undefined;
        nationality?: string | undefined;
    }>;
    source: z.ZodDefault<z.ZodEnum<[BookingSource.WEBSITE, BookingSource.FRONT_DESK, BookingSource.ADMIN, BookingSource.WALK_IN, BookingSource.PARTNER_OTA]>>;
    specialRequests: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    guest: {
        email: string;
        fullName: string;
        mobile: string;
        nationality: string;
        address?: {
            country: string;
            city?: string | undefined;
            state?: string | undefined;
            pincode?: string | undefined;
            street?: string | undefined;
        } | undefined;
    };
    numberOfRooms: number;
    source: BookingSource;
    discountCode?: string | undefined;
    roomTypeId?: string | undefined;
    specialRequests?: string | undefined;
    holdId?: string | undefined;
    bookingType?: "DAILY" | "HOURLY" | undefined;
    durationHours?: number | undefined;
    specificRoomId?: string | undefined;
    holdToken?: string | undefined;
    guestComposition?: {
        males: number;
        females: number;
    } | undefined;
}, {
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    guest: {
        email: string;
        fullName: string;
        mobile: string;
        address?: {
            city?: string | undefined;
            state?: string | undefined;
            pincode?: string | undefined;
            country?: string | undefined;
            street?: string | undefined;
        } | undefined;
        nationality?: string | undefined;
    };
    discountCode?: string | undefined;
    roomTypeId?: string | undefined;
    numberOfRooms?: number | undefined;
    source?: BookingSource | undefined;
    specialRequests?: string | undefined;
    holdId?: string | undefined;
    bookingType?: "DAILY" | "HOURLY" | undefined;
    durationHours?: number | undefined;
    specificRoomId?: string | undefined;
    holdToken?: string | undefined;
    guestComposition?: {
        males?: number | undefined;
        females?: number | undefined;
    } | undefined;
}>;
export declare const cancelBookingSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const getBookingVerificationQuerySchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    mobile?: string | undefined;
}, {
    email?: string | undefined;
    mobile?: string | undefined;
}>;
