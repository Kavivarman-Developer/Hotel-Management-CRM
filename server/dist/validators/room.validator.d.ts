import { z } from 'zod';
import { RoomStatus, HousekeepingStatus } from '../types';
export declare const createRoomSchema: z.ZodObject<{
    roomNumber: z.ZodString;
    roomTypeId: z.ZodString;
    floor: z.ZodDefault<z.ZodNumber>;
    maxGuests: z.ZodNumber;
    amenities: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    status: z.ZodDefault<z.ZodEnum<[RoomStatus.ACTIVE, RoomStatus.INACTIVE, RoomStatus.MAINTENANCE]>>;
    housekeepingStatus: z.ZodDefault<z.ZodEnum<[HousekeepingStatus.CLEAN, HousekeepingStatus.DIRTY, HousekeepingStatus.INSPECTED, HousekeepingStatus.OUT_OF_SERVICE]>>;
}, "strip", z.ZodTypeAny, {
    status: RoomStatus;
    roomTypeId: string;
    roomNumber: string;
    floor: number;
    maxGuests: number;
    amenities: string[];
    housekeepingStatus: HousekeepingStatus;
}, {
    roomTypeId: string;
    roomNumber: string;
    maxGuests: number;
    status?: RoomStatus | undefined;
    floor?: number | undefined;
    amenities?: string[] | undefined;
    housekeepingStatus?: HousekeepingStatus | undefined;
}>;
export declare const updateRoomSchema: z.ZodObject<{
    roomNumber: z.ZodOptional<z.ZodString>;
    roomTypeId: z.ZodOptional<z.ZodString>;
    floor: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    maxGuests: z.ZodOptional<z.ZodNumber>;
    amenities: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<[RoomStatus.ACTIVE, RoomStatus.INACTIVE, RoomStatus.MAINTENANCE]>>>;
    housekeepingStatus: z.ZodOptional<z.ZodDefault<z.ZodEnum<[HousekeepingStatus.CLEAN, HousekeepingStatus.DIRTY, HousekeepingStatus.INSPECTED, HousekeepingStatus.OUT_OF_SERVICE]>>>;
}, "strip", z.ZodTypeAny, {
    status?: RoomStatus | undefined;
    roomTypeId?: string | undefined;
    roomNumber?: string | undefined;
    floor?: number | undefined;
    maxGuests?: number | undefined;
    amenities?: string[] | undefined;
    housekeepingStatus?: HousekeepingStatus | undefined;
}, {
    status?: RoomStatus | undefined;
    roomTypeId?: string | undefined;
    roomNumber?: string | undefined;
    floor?: number | undefined;
    maxGuests?: number | undefined;
    amenities?: string[] | undefined;
    housekeepingStatus?: HousekeepingStatus | undefined;
}>;
export declare const maintenanceBlockSchema: z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    reason: string;
}, {
    startDate: string;
    endDate: string;
    reason: string;
}>;
export declare const createRoomTypeSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodString;
    tagline: z.ZodOptional<z.ZodString>;
    category: z.ZodDefault<z.ZodString>;
    maxOccupancy: z.ZodObject<{
        adults: z.ZodNumber;
        children: z.ZodDefault<z.ZodNumber>;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        adults: number;
        children: number;
    }, {
        total: number;
        adults: number;
        children?: number | undefined;
    }>;
    bedConfiguration: z.ZodString;
    amenities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    features: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    baseRate: z.ZodNumber;
    defaultNightlyRate: z.ZodNumber;
    sizeSqFt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    description: string;
    amenities: string[];
    category: string;
    maxOccupancy: {
        total: number;
        adults: number;
        children: number;
    };
    bedConfiguration: string;
    features: string[];
    images: string[];
    baseRate: number;
    defaultNightlyRate: number;
    tagline?: string | undefined;
    sizeSqFt?: number | undefined;
}, {
    code: string;
    name: string;
    description: string;
    maxOccupancy: {
        total: number;
        adults: number;
        children?: number | undefined;
    };
    bedConfiguration: string;
    baseRate: number;
    defaultNightlyRate: number;
    amenities?: string[] | undefined;
    tagline?: string | undefined;
    category?: string | undefined;
    features?: string[] | undefined;
    images?: string[] | undefined;
    sizeSqFt?: number | undefined;
}>;
