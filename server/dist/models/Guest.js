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
exports.Guest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GuestSchema = new mongoose_1.Schema({
    fullName: {
        type: String,
        required: [true, 'Guest full name is required'],
        trim: true,
        index: true,
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        index: true,
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        country: { type: String, default: 'India', trim: true },
    },
    nationality: {
        type: String,
        default: 'Indian',
        trim: true,
    },
    idProofType: {
        type: String,
        enum: ['Aadhaar', 'Passport', 'Driving License', 'Voter ID', 'Other'],
    },
    idProofNumberMasked: {
        type: String,
        trim: true,
    },
    bookingReferences: {
        type: [String],
        default: [],
    },
    consentRecords: [
        {
            consentType: { type: String, required: true },
            granted: { type: Boolean, required: true },
            timestamp: { type: Date, default: Date.now },
            ipAddress: { type: String },
        },
    ],
}, {
    timestamps: true,
});
GuestSchema.index({ email: 1, mobile: 1 });
exports.Guest = mongoose_1.default.model('Guest', GuestSchema);
//# sourceMappingURL=Guest.js.map