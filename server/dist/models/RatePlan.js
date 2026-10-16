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
exports.RatePlan = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RatePlanSchema = new mongoose_1.Schema({
    roomTypeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoomType',
        required: [true, 'Room type is required'],
        index: true,
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true,
    },
    defaultRate: {
        type: Number,
        required: [true, 'Default rate in paise is required'],
        min: 0,
    },
    dateSpecificRates: [
        {
            date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
            rate: { type: Number, required: true, min: 0 },
            reason: { type: String },
        },
    ],
    weekdayWeekendRules: {
        weekendMultiplier: { type: Number, default: 1.0 },
        weekendRate: { type: Number },
        applyOnDays: { type: [Number], default: [5, 6] }, // Friday & Saturday
    },
    seasonalRules: [
        {
            name: { type: String, required: true },
            startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
            endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
            multiplier: { type: Number },
            fixedRate: { type: Number },
        },
    ],
    extraGuestCharges: {
        type: Number,
        default: 50000, // ₹500 in paise per extra guest per night
        min: 0,
    },
    discountConfiguration: [
        {
            code: { type: String, uppercase: true, trim: true },
            percentage: { type: Number, min: 0, max: 100 },
            maxDiscountAmount: { type: Number, min: 0 },
            validFrom: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
            validTo: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
            active: { type: Boolean, default: true },
        },
    ],
    taxConfiguration: {
        gstPercentage: { type: Number, default: 12, min: 0, max: 100 },
        name: { type: String, default: 'GST' },
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
RatePlanSchema.index({ roomTypeId: 1, isActive: 1 });
exports.RatePlan = mongoose_1.default.model('RatePlan', RatePlanSchema);
//# sourceMappingURL=RatePlan.js.map