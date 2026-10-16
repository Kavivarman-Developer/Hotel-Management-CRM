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
exports.Voucher = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const VoucherSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: [true, 'Voucher code is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
        required: true,
        default: 'PERCENTAGE',
    },
    discountValue: {
        type: Number,
        required: true,
        min: [1, 'Discount value must be at least 1'],
    },
    minBookingAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    maxDiscountAmount: {
        type: Number,
        min: 0,
    },
    validFrom: {
        type: Date,
        default: Date.now,
    },
    validUntil: {
        type: Date,
        required: true,
    },
    usageLimit: {
        type: Number,
        default: 500,
        min: 1,
    },
    timesUsed: {
        type: Number,
        default: 0,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
VoucherSchema.index({ code: 1, isActive: 1 });
exports.Voucher = mongoose_1.default.model('Voucher', VoucherSchema);
//# sourceMappingURL=Voucher.js.map