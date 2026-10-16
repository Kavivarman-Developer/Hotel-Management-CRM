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
exports.ExtraStayRequest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExtraStayRequestSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true,
    },
    stayId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'StayRecord',
        index: true,
    },
    bookingReference: {
        type: String,
        required: true,
        index: true,
    },
    guestName: {
        type: String,
        required: true,
    },
    guestMobile: {
        type: String,
        required: true,
    },
    roomNumber: {
        type: String,
        required: true,
    },
    currentCheckOutDate: {
        type: String,
        required: true,
    },
    currentCheckOutTime: {
        type: String,
        default: '11:00 AM',
    },
    requestedExtraHours: {
        type: Number,
        required: true,
        min: 1,
        max: 24,
    },
    newExpectedCheckOutTime: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    hourlyRatePaise: {
        type: Number,
        default: 20000, // ₹200/hr
    },
    chargeAmountPaise: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
        default: 'PENDING',
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'ADDED_TO_FOLIO', 'PAID'],
        default: 'PENDING',
        index: true,
    },
    staffNotes: {
        type: String,
    },
    rejectionReason: {
        type: String,
    },
    actionedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    actionedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
ExtraStayRequestSchema.index({ status: 1, createdAt: -1 });
exports.ExtraStayRequest = mongoose_1.default.model('ExtraStayRequest', ExtraStayRequestSchema);
//# sourceMappingURL=ExtraStayRequest.js.map