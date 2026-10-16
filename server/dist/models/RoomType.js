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
exports.RoomType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RoomTypeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Room type name is required'],
        trim: true,
    },
    code: {
        type: String,
        required: [true, 'Room type code is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    tagline: {
        type: String,
    },
    category: {
        type: String,
        required: true,
        default: 'deluxe',
    },
    maxOccupancy: {
        adults: { type: Number, required: true, min: 1 },
        children: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 1 },
    },
    bedConfiguration: {
        type: String,
        required: true,
    },
    amenities: {
        type: [String],
        default: [],
    },
    features: {
        type: [String],
        default: [],
    },
    images: {
        type: [String],
        default: [],
    },
    baseRate: {
        type: Number,
        required: true,
        min: 0,
    },
    defaultNightlyRate: {
        type: Number,
        required: true,
        min: 0,
    },
    sizeSqFt: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
exports.RoomType = mongoose_1.default.model('RoomType', RoomTypeSchema);
//# sourceMappingURL=RoomType.js.map