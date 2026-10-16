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
exports.Booking = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../types");
const NightlyRateBreakdownSchema = new mongoose_1.Schema({
    date: { type: String, required: true },
    baseRate: { type: Number, required: true },
    effectiveRate: { type: Number, required: true },
    discountedRate: { type: Number, required: true },
    extraGuestCharge: { type: Number, default: 0 },
    totalNightRate: { type: Number, required: true },
}, { _id: false });
const BookingSchema = new mongoose_1.Schema({
    bookingReference: {
        type: String,
        required: [true, 'Booking reference is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
    },
    guestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Guest',
        required: [true, 'Guest reference is required'],
        index: true,
    },
    assignedRoomId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Assigned room reference is required'],
        index: true,
    },
    roomTypeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoomType',
        required: [true, 'Room type reference is required'],
        index: true,
    },
    checkInDate: {
        type: String,
        required: [true, 'Check-in date is required'],
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Check-in date must be YYYY-MM-DD'],
        index: true,
    },
    checkOutDate: {
        type: String,
        required: [true, 'Check-out date is required'],
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Check-out date must be YYYY-MM-DD'],
        index: true,
    },
    numberOfGuests: {
        type: Number,
        required: true,
        min: 1,
    },
    numberOfRooms: {
        type: Number,
        default: 1,
        min: 1,
    },
    reservationStatus: {
        type: String,
        enum: Object.values(types_1.ReservationStatus),
        default: types_1.ReservationStatus.CONFIRMED,
        index: true,
    },
    stayStatus: {
        type: String,
        enum: Object.values(types_1.StayStatus),
        default: types_1.StayStatus.NOT_CHECKED_IN,
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: Object.values(types_1.PaymentStatus),
        default: types_1.PaymentStatus.PENDING,
        index: true,
    },
    nightlyPriceBreakdown: {
        type: [NightlyRateBreakdownSchema],
        required: true,
        default: [],
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    discountCode: {
        type: String,
        trim: true,
    },
    taxes: {
        type: Number,
        required: true,
        min: 0,
    },
    taxRatePercentage: {
        type: Number,
        default: 12,
        min: 0,
    },
    extraCharges: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true,
    },
    source: {
        type: String,
        enum: Object.values(types_1.BookingSource),
        default: types_1.BookingSource.WEBSITE,
    },
    specialRequests: {
        type: String,
        trim: true,
    },
    qrTokenHash: {
        type: String,
        index: true,
    },
    qrTokenExpiresAt: {
        type: Date,
    },
    holdId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoomHold',
    },
    idempotencyKey: {
        type: String,
        index: true,
    },
    cancelledAt: {
        type: Date,
    },
    cancellationReason: {
        type: String,
    },
    cancelledBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
// Compound indexes for availability and inventory search
BookingSchema.index({ assignedRoomId: 1, reservationStatus: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ reservationStatus: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ createdAt: -1 });
exports.Booking = mongoose_1.default.model('Booking', BookingSchema);
//# sourceMappingURL=Booking.js.map