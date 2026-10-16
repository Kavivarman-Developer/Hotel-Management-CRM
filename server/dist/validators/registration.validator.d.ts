import { z } from 'zod';
export declare const qrValidateParamSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const guestRegistrationSchema: z.ZodObject<{
    primaryGuest: z.ZodObject<{
        fullName: z.ZodString;
        phone: z.ZodString;
        email: z.ZodString;
        nationality: z.ZodDefault<z.ZodString>;
        idProofType: z.ZodEnum<["Aadhaar", "Passport", "Driving License", "Voter ID", "Other"]>;
        idProofNumber: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        fullName: string;
        idProofNumber: string;
        nationality: string;
        idProofType: "Aadhaar" | "Passport" | "Driving License" | "Voter ID" | "Other";
        phone: string;
    }, {
        email: string;
        fullName: string;
        idProofNumber: string;
        idProofType: "Aadhaar" | "Passport" | "Driving License" | "Voter ID" | "Other";
        phone: string;
        nationality?: string | undefined;
    }>;
    additionalGuests: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        age: z.ZodNumber;
        relation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        age: number;
        relation: string;
    }, {
        name: string;
        age: number;
        relation: string;
    }>, "many">>;
    vehicleNumber: z.ZodOptional<z.ZodString>;
    estimatedArrivalTime: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        relationship: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string;
        relationship: string;
    }, {
        name: string;
        phone: string;
        relationship: string;
    }>>;
    specialRequests: z.ZodOptional<z.ZodString>;
    consentGranted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    primaryGuest: {
        email: string;
        fullName: string;
        idProofNumber: string;
        nationality: string;
        idProofType: "Aadhaar" | "Passport" | "Driving License" | "Voter ID" | "Other";
        phone: string;
    };
    consentGranted: boolean;
    specialRequests?: string | undefined;
    additionalGuests?: {
        name: string;
        age: number;
        relation: string;
    }[] | undefined;
    vehicleNumber?: string | undefined;
    estimatedArrivalTime?: string | undefined;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    } | undefined;
}, {
    primaryGuest: {
        email: string;
        fullName: string;
        idProofNumber: string;
        idProofType: "Aadhaar" | "Passport" | "Driving License" | "Voter ID" | "Other";
        phone: string;
        nationality?: string | undefined;
    };
    consentGranted: boolean;
    specialRequests?: string | undefined;
    additionalGuests?: {
        name: string;
        age: number;
        relation: string;
    }[] | undefined;
    vehicleNumber?: string | undefined;
    estimatedArrivalTime?: string | undefined;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    } | undefined;
}>;
export declare const reviewRegistrationSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
    notes?: string | undefined;
}, {
    reason?: string | undefined;
    notes?: string | undefined;
}>;
