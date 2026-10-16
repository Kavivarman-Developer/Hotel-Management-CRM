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
exports.StayRecord = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AdditionalChargeSchema = new mongoose_1.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
        type: String,
        enum: ['MINI_BAR', 'ROOM_SERVICE', 'LAUNDRY', 'DAMAGE', 'OVERSTAY', 'OTHER'],
        default: 'OTHER',
    },
    addedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now },
}, { _id: true });
const StayRecordSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true,
        index: true,
    },
    roomId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true,
    },
    actualCheckInTimestamp: {
        type: Date,
        required: true,
        default: Date.now,
    },
    checkedInBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    actualCheckOutTimestamp: {
        type: Date,
    },
    checkedOutBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    additionalCharges: {
        type: [AdditionalChargeSchema],
        default: [],
    },
    finalBillReference: {
        type: String,
    },
    finalPaidAmount: {
        type: Number,
        min: 0,
    },
    stayStatus: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED'],
        default: 'ACTIVE',
        index: true,
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});
StayRecordSchema.index({ stayStatus: 1, actualCheckInTimestamp: -1 });
exports.StayRecord = mongoose_1.default.model('StayRecord', StayRecordSchema);
//# sourceMappingURL=StayRecord.js.map