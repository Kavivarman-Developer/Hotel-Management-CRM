"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestRegistration = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../types");
const SecureDocRefSchema = new mongoose_1.Schema({
    docType: { type: String, required: true },
    fileKey: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: true });
const GuestRegistrationSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        required: false,
        index: {
            unique: true,
            partialFilterExpression: { bookingId: { $type: 'objectId' } },
        },
    },
    walkInReference: {
        type: String,
        sparse: true,
        index: true,
    },
    guestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Guest',
        required: true,
        index: true,
    },
    registrationDetails: {
        type: {
            primaryGuest: {
                fullName: { type: String, required: true },
                phone: { type: String, required: true },
                email: { type: String, required: true },
                nationality: { type: String, default: 'Indian' },
                idProofType: { type: String, required: true },
                idProofNumberMasked: { type: String, required: true },
            },
            additionalGuests: [
                {
                    name: { type: String, required: true },
                    age: { type: Number, required: true },
                    relation: { type: String, required: true },
                },
            ],
            vehicleNumber: { type: String },
            estimatedArrivalTime: { type: String },
            emergencyContact: {
                name: { type: String },
                phone: { type: String },
                relationship: { type: String },
            },
            specialRequests: { type: String },
        },
        required: true,
    },
    verificationStatus: {
        type: String,
        enum: Object.values(types_1.RegistrationStatus),
        default: types_1.RegistrationStatus.PENDING,
        index: true,
    },
    consentRecords: [
        {
            consentType: { type: String, required: true },
            granted: { type: Boolean, required: true },
            timestamp: { type: Date, default: Date.now },
        },
    ],
    secureDocumentReferences: {
        type: [SecureDocRefSchema],
        default: [],
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewNotes: {
        type: String,
    },
    submittedAt: {
        type: Date,
    },
    verifiedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
exports.GuestRegistration = mongoose_1.default.model('GuestRegistration', GuestRegistrationSchema);
//# sourceMappingURL=GuestRegistration.js.map