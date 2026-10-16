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
exports.Room = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../types");
const MaintenanceBlockSchema = new mongoose_1.Schema({
    startDate: {
        type: String,
        required: true,
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'],
    },
    endDate: {
        type: String,
        required: true,
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'],
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    blockedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: true });
const RoomSchema = new mongoose_1.Schema({
    roomNumber: {
        type: String,
        required: [true, 'Room number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
    },
    roomTypeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoomType',
        required: [true, 'Room type reference is required'],
        index: true,
    },
    floor: {
        type: Number,
        default: 1,
    },
    maxGuests: {
        type: Number,
        required: [true, 'Maximum guests is required'],
        min: 1,
    },
    amenities: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: Object.values(types_1.RoomStatus),
        default: types_1.RoomStatus.ACTIVE,
        index: true,
    },
    housekeepingStatus: {
        type: String,
        enum: Object.values(types_1.HousekeepingStatus),
        default: types_1.HousekeepingStatus.CLEAN,
        index: true,
    },
    maintenanceInfo: {
        type: [MaintenanceBlockSchema],
        default: [],
    },
}, {
    timestamps: true,
});
RoomSchema.index({ roomTypeId: 1, status: 1 });
exports.Room = mongoose_1.default.model('Room', RoomSchema);
//# sourceMappingURL=Room.js.map