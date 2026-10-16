import { z } from 'zod';
import { PartnerListingStatus, PartnerApprovalStatus } from '../types';
export declare const createPartnerSchema: z.ZodObject<{
    hotelName: z.ZodString;
    description: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    contactInformation: z.ZodObject<{
        phone: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone: string;
    }, {
        email: string;
        phone: string;
    }>;
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    amenities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    officialWebsiteUrl: z.ZodEffects<z.ZodString, string, string>;
    externalBookingUrl: z.ZodEffects<z.ZodString, string, string>;
    listingStatus: z.ZodDefault<z.ZodEnum<[PartnerListingStatus.DRAFT, PartnerListingStatus.ACTIVE, PartnerListingStatus.INACTIVE]>>;
    approvalStatus: z.ZodDefault<z.ZodEnum<[PartnerApprovalStatus.PENDING, PartnerApprovalStatus.APPROVED, PartnerApprovalStatus.REJECTED]>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    amenities: string[];
    images: string[];
    address: string;
    city: string;
    hotelName: string;
    contactInformation: {
        email: string;
        phone: string;
    };
    officialWebsiteUrl: string;
    externalBookingUrl: string;
    listingStatus: PartnerListingStatus;
    approvalStatus: PartnerApprovalStatus;
}, {
    description: string;
    address: string;
    city: string;
    hotelName: string;
    contactInformation: {
        email: string;
        phone: string;
    };
    officialWebsiteUrl: string;
    externalBookingUrl: string;
    amenities?: string[] | undefined;
    images?: string[] | undefined;
    listingStatus?: PartnerListingStatus | undefined;
    approvalStatus?: PartnerApprovalStatus | undefined;
}>;
export declare const updatePartnerSchema: z.ZodObject<{
    hotelName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    contactInformation: z.ZodOptional<z.ZodObject<{
        phone: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone: string;
    }, {
        email: string;
        phone: string;
    }>>;
    images: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    amenities: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    officialWebsiteUrl: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    externalBookingUrl: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    listingStatus: z.ZodOptional<z.ZodDefault<z.ZodEnum<[PartnerListingStatus.DRAFT, PartnerListingStatus.ACTIVE, PartnerListingStatus.INACTIVE]>>>;
    approvalStatus: z.ZodOptional<z.ZodDefault<z.ZodEnum<[PartnerApprovalStatus.PENDING, PartnerApprovalStatus.APPROVED, PartnerApprovalStatus.REJECTED]>>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    amenities?: string[] | undefined;
    images?: string[] | undefined;
    address?: string | undefined;
    city?: string | undefined;
    hotelName?: string | undefined;
    contactInformation?: {
        email: string;
        phone: string;
    } | undefined;
    officialWebsiteUrl?: string | undefined;
    externalBookingUrl?: string | undefined;
    listingStatus?: PartnerListingStatus | undefined;
    approvalStatus?: PartnerApprovalStatus | undefined;
}, {
    description?: string | undefined;
    amenities?: string[] | undefined;
    images?: string[] | undefined;
    address?: string | undefined;
    city?: string | undefined;
    hotelName?: string | undefined;
    contactInformation?: {
        email: string;
        phone: string;
    } | undefined;
    officialWebsiteUrl?: string | undefined;
    externalBookingUrl?: string | undefined;
    listingStatus?: PartnerListingStatus | undefined;
    approvalStatus?: PartnerApprovalStatus | undefined;
}>;
