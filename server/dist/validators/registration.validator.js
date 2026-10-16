"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRegistrationSchema = exports.guestRegistrationSchema = exports.qrValidateParamSchema = void 0;
const zod_1 = require("zod");
exports.qrValidateParamSchema = zod_1.z.object({
    token: zod_1.z.string().min(16, 'Invalid token length'),
});
exports.guestRegistrationSchema = zod_1.z.object({
    primaryGuest: zod_1.z.object({
        fullName: zod_1.z.string().min(2, 'Full name is required').trim(),
        phone: zod_1.z.string().min(10, 'Valid phone number is required').trim(),
        email: zod_1.z.string().email('Valid email is required').trim(),
        nationality: zod_1.z.string().default('Indian'),
        idProofType: zod_1.z.enum(['Aadhaar', 'Passport', 'Driving License', 'Voter ID', 'Other']),
        idProofNumber: zod_1.z.string().min(4, 'ID proof number is required').trim(),
    }),
    additionalGuests: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'Guest name is required'),
        age: zod_1.z.number().int().min(0),
        relation: zod_1.z.string().min(1, 'Relation is required'),
    }))
        .optional(),
    vehicleNumber: zod_1.z.string().optional(),
    estimatedArrivalTime: zod_1.z.string().optional(),
    emergencyContact: zod_1.z
        .object({
        name: zod_1.z.string(),
        phone: zod_1.z.string(),
        relationship: zod_1.z.string(),
    })
        .optional(),
    specialRequests: zod_1.z.string().optional(),
    consentGranted: zod_1.z.boolean().refine((val) => val === true, 'Consent must be granted'),
});
exports.reviewRegistrationSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
});
//# sourceMappingURL=registration.validator.js.map