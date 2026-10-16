"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePartnerSchema = exports.createPartnerSchema = void 0;
const zod_1 = require("zod");
const env_1 = require("../config/env");
const types_1 = require("../types");
const urlValidator = zod_1.z.string().url().refine((url) => {
    if (env_1.env.NODE_ENV === 'production') {
        return url.startsWith('https://');
    }
    return url.startsWith('http://') || url.startsWith('https://');
}, {
    message: 'External URLs must use HTTPS in production',
});
exports.createPartnerSchema = zod_1.z.object({
    hotelName: zod_1.z.string().min(2).trim(),
    description: zod_1.z.string().min(10),
    address: zod_1.z.string().min(5),
    city: zod_1.z.string().min(2),
    contactInformation: zod_1.z.object({
        phone: zod_1.z.string().min(5),
        email: zod_1.z.string().email(),
    }),
    images: zod_1.z.array(zod_1.z.string()).default([]),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    officialWebsiteUrl: urlValidator,
    externalBookingUrl: urlValidator,
    listingStatus: zod_1.z.enum([types_1.PartnerListingStatus.DRAFT, types_1.PartnerListingStatus.ACTIVE, types_1.PartnerListingStatus.INACTIVE]).default(types_1.PartnerListingStatus.ACTIVE),
    approvalStatus: zod_1.z.enum([types_1.PartnerApprovalStatus.PENDING, types_1.PartnerApprovalStatus.APPROVED, types_1.PartnerApprovalStatus.REJECTED]).default(types_1.PartnerApprovalStatus.APPROVED),
});
exports.updatePartnerSchema = exports.createPartnerSchema.partial();
//# sourceMappingURL=partner.validator.js.map