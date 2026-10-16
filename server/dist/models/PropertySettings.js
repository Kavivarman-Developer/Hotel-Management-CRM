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
exports.PropertySettings = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PropertySettingsSchema = new mongoose_1.Schema({
    propertyName: {
        type: String,
        default: 'GRAND OMR RESIDENCY',
    },
    tagline: {
        type: String,
        default: 'Luxury Stay & Mobile Booking in Navalur, Chennai',
    },
    address: {
        type: String,
        default: '5, Rajiv Gandhi Salai, Sholinganallur, Navalur',
    },
    city: {
        type: String,
        default: 'Chennai',
    },
    state: {
        type: String,
        default: 'Tamil Nadu',
    },
    pincode: {
        type: String,
        default: '600130',
    },
    country: {
        type: String,
        default: 'India',
    },
    phone: {
        type: String,
        default: '+91 8110018708',
    },
    email: {
        type: String,
        default: 'reservations@grandomrresidency.com',
    },
    checkInTime: {
        type: String,
        default: '14:00',
    },
    checkOutTime: {
        type: String,
        default: '11:00',
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata',
    },
    holdDurationMinutes: {
        type: Number,
        default: 15,
        min: 5,
        max: 60,
    },
    defaultGstPercentage: {
        type: Number,
        default: 12,
    },
    cancellationGraceHours: {
        type: Number,
        default: 24,
    },
    allowSameDayBooking: {
        type: Boolean,
        default: true,
    },
    extraStayHourlyRatePaise: {
        type: Number,
        default: 20000,
    },
    rolePermissions: {
        type: Map,
        of: [String],
        default: () => new Map(),
    },
}, {
    timestamps: true,
});
exports.PropertySettings = mongoose_1.default.model('PropertySettings', PropertySettingsSchema);
//# sourceMappingURL=PropertySettings.js.map