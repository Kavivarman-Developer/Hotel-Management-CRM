"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Room_1 = require("../models/Room");
const RoomType_1 = require("../models/RoomType");
const RatePlan_1 = require("../models/RatePlan");
const Booking_1 = require("../models/Booking");
const RoomHold_1 = require("../models/RoomHold");
const pricing_service_1 = require("./pricing.service");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
class AvailabilityService {
    /**
     * Helper to format paise into INR string
     */
    static formatINR(paise) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(paise / 100);
    }
    /**
     * Checks if two date ranges overlap. Checkout date is exclusive.
     * Overlap rule: existing.checkIn < requested.checkOut && existing.checkOut > requested.checkIn
     */
    static isDateOverlap(startA, endA, startB, endB) {
        return startA < endB && endA > startB;
    }
    /**
     * Find available room types and eligible physical rooms.
     */
    static async checkAvailability(params, session = null) {
        const { checkIn, checkOut, guests, rooms = 1, roomTypeId, discountCode } = params;
        // 1. Basic date checks
        if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
            throw new errors_1.BadRequestError('Dates must be in YYYY-MM-DD format');
        }
        if (checkIn >= checkOut) {
            throw new errors_1.BadRequestError('checkIn must be strictly before checkOut date');
        }
        if (guests < 1) {
            throw new errors_1.BadRequestError('guests count must be a positive integer');
        }
        if (rooms < 1) {
            throw new errors_1.BadRequestError('rooms count must be a positive integer');
        }
        // 2. Fetch all active physical rooms
        const roomQuery = {
            status: types_1.RoomStatus.ACTIVE,
        };
        if (roomTypeId) {
            roomQuery.roomTypeId = new mongoose_1.default.Types.ObjectId(roomTypeId);
        }
        const allActiveRooms = await Room_1.Room.find(roomQuery).session(session).lean();
        if (allActiveRooms.length === 0) {
            return {
                searchCriteria: { checkIn, checkOut, guests, rooms, roomTypeId },
                available: false,
                totalAvailableRooms: 0,
                roomTypes: [],
            };
        }
        const roomIds = allActiveRooms.map((r) => r._id);
        // 3. Find confirmed overlapping bookings
        // Rule: reservationStatus blocks unless CANCELLED or EXPIRED
        const blockingBookings = await Booking_1.Booking.find({
            assignedRoomId: { $in: roomIds },
            reservationStatus: {
                $in: [types_1.ReservationStatus.CONFIRMED, types_1.ReservationStatus.PENDING_PAYMENT, types_1.ReservationStatus.HELD],
            },
            checkInDate: { $lt: checkOut },
            checkOutDate: { $gt: checkIn },
        })
            .session(session)
            .select('assignedRoomId')
            .lean();
        const bookedRoomIds = new Set(blockingBookings.map((b) => b.assignedRoomId.toString()));
        // 4. Find active, unexpired holds
        // Expired holds MUST NOT block inventory even without background cleanup!
        const now = new Date();
        const activeHolds = await RoomHold_1.RoomHold.find({
            roomId: { $in: roomIds },
            status: types_1.HoldStatus.ACTIVE,
            expirationTimestamp: { $gt: now },
            checkInDate: { $lt: checkOut },
            checkOutDate: { $gt: checkIn },
        })
            .session(session)
            .select('roomId')
            .lean();
        const heldRoomIds = new Set(activeHolds.map((h) => h.roomId.toString()));
        // 5. Filter out rooms in maintenance during requested dates
        const availableRooms = allActiveRooms.filter((room) => {
            const roomIdStr = room._id.toString();
            // Check bookings
            if (bookedRoomIds.has(roomIdStr))
                return false;
            // Check holds
            if (heldRoomIds.has(roomIdStr))
                return false;
            // Check maintenance blocks
            if (room.maintenanceInfo && room.maintenanceInfo.length > 0) {
                const inMaintenance = room.maintenanceInfo.some((block) => this.isDateOverlap(block.startDate, block.endDate, checkIn, checkOut));
                if (inMaintenance)
                    return false;
            }
            return true;
        });
        // 6. Group available rooms by roomTypeId and evaluate capacity & pricing
        const roomsByType = new Map();
        for (const room of availableRooms) {
            const typeIdStr = room.roomTypeId.toString();
            if (!roomsByType.has(typeIdStr)) {
                roomsByType.set(typeIdStr, []);
            }
            roomsByType.get(typeIdStr).push(room);
        }
        // 7. Calculate pricing for each room type
        const eligibleRoomTypes = [];
        for (const [typeIdStr, typeRooms] of roomsByType.entries()) {
            if (typeRooms.length < rooms) {
                // Not enough rooms to satisfy requested room count
                continue;
            }
            const roomType = await RoomType_1.RoomType.findById(typeIdStr).session(session);
            if (!roomType || !roomType.isActive)
                continue;
            // Capacity check
            if (roomType.maxOccupancy.total < guests) {
                continue;
            }
            // Find active RatePlan
            const ratePlan = await RatePlan_1.RatePlan.findOne({
                roomTypeId: roomType._id,
                isActive: true,
            }).session(session);
            if (!ratePlan) {
                continue;
            }
            try {
                const pricing = pricing_service_1.PricingService.calculatePricing(ratePlan, roomType, checkIn, checkOut, guests, discountCode);
                eligibleRoomTypes.push({
                    roomType: {
                        id: roomType._id.toString(),
                        name: roomType.name,
                        code: roomType.code,
                        description: roomType.description,
                        tagline: roomType.tagline,
                        category: roomType.category,
                        bedConfiguration: roomType.bedConfiguration,
                        maxOccupancy: roomType.maxOccupancy,
                        amenities: roomType.amenities,
                        features: roomType.features,
                        images: roomType.images,
                        sizeSqFt: roomType.sizeSqFt,
                    },
                    availableRoomsCount: typeRooms.length,
                    availableRoomIds: typeRooms.map((r) => r._id.toString()),
                    pricing: {
                        ...pricing,
                        formattedTotalAmount: this.formatINR(pricing.totalAmount),
                    },
                });
            }
            catch (err) {
                console.warn(`[Availability] Pricing calculation failed for roomType ${roomType.code}:`, err.message);
            }
        }
        return {
            searchCriteria: { checkIn, checkOut, guests, rooms, roomTypeId },
            available: eligibleRoomTypes.length > 0,
            totalAvailableRooms: availableRooms.length,
            roomTypes: eligibleRoomTypes,
        };
    }
}
exports.AvailabilityService = AvailabilityService;
//# sourceMappingURL=availability.service.js.map