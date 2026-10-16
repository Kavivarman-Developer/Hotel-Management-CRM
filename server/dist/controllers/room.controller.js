"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Room_1 = require("../models/Room");
const RoomType_1 = require("../models/RoomType");
const RatePlan_1 = require("../models/RatePlan");
const Booking_1 = require("../models/Booking");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
const audit_1 = require("../utils/audit");
class RoomController {
    // --- Public Room Endpoints ---
    static async listPublicRooms(req, res, next) {
        try {
            const rooms = await Room_1.Room.find({ status: types_1.RoomStatus.ACTIVE })
                .populate('roomTypeId', 'name code category bedConfiguration amenities images defaultNightlyRate')
                .select('-maintenanceInfo');
            (0, response_1.sendSuccess)(res, rooms, 'Rooms retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async getPublicRoom(req, res, next) {
        try {
            const id = req.params.id;
            const room = await Room_1.Room.findOne({ _id: id, status: types_1.RoomStatus.ACTIVE })
                .populate('roomTypeId')
                .select('-maintenanceInfo');
            if (!room) {
                throw new errors_1.NotFoundError('Room not found');
            }
            (0, response_1.sendSuccess)(res, room, 'Room retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async listRoomTypes(req, res, next) {
        try {
            const roomTypes = await RoomType_1.RoomType.find({ isActive: true });
            (0, response_1.sendSuccess)(res, roomTypes, 'Room types retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // --- Admin Room Management ---
    static async adminListRooms(req, res, next) {
        try {
            const rooms = await Room_1.Room.find()
                .populate('roomTypeId')
                .populate('maintenanceInfo.blockedBy', 'name email')
                .sort({ roomNumber: 1 });
            const todayStr = new Date().toISOString().split('T')[0];
            // Find all active bookings overlapping today
            const activeBookings = await Booking_1.Booking.find({
                reservationStatus: {
                    $in: [types_1.ReservationStatus.CONFIRMED, types_1.ReservationStatus.PENDING_PAYMENT, types_1.ReservationStatus.HELD],
                },
                checkInDate: { $lte: todayStr },
                checkOutDate: { $gt: todayStr },
            }).populate('guestId', 'fullName mobile email');
            const activeBookingMap = new Map();
            for (const b of activeBookings) {
                if (b.assignedRoomId) {
                    activeBookingMap.set(b.assignedRoomId.toString(), b);
                }
            }
            const enrichedRooms = rooms.map((room) => {
                const roomObj = room.toObject();
                const activeBooking = activeBookingMap.get(room._id.toString());
                roomObj.isOccupied = Boolean(activeBooking);
                if (activeBooking) {
                    roomObj.currentBooking = {
                        bookingReference: activeBooking.bookingReference,
                        guestName: activeBooking.guestId?.fullName || 'In-House Guest',
                        guestMobile: activeBooking.guestId?.mobile,
                        checkInDate: activeBooking.checkInDate,
                        checkOutDate: activeBooking.checkOutDate,
                        stayType: activeBooking.bookingType,
                    };
                }
                return roomObj;
            });
            (0, response_1.sendSuccess)(res, enrichedRooms, 'All rooms retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async adminCreateRoom(req, res, next) {
        try {
            const { roomNumber, roomTypeId, floor, maxGuests, amenities, status, housekeepingStatus } = req.body;
            const existing = await Room_1.Room.findOne({ roomNumber: roomNumber.toUpperCase().trim() });
            if (existing) {
                throw new errors_1.BadRequestError(`Room number ${roomNumber} already exists`);
            }
            const room = await Room_1.Room.create({
                roomNumber: roomNumber.toUpperCase().trim(),
                roomTypeId,
                floor: floor || 1,
                maxGuests,
                amenities: amenities || [],
                status: status || types_1.RoomStatus.ACTIVE,
                housekeepingStatus: housekeepingStatus || types_1.HousekeepingStatus.CLEAN,
            });
            await (0, audit_1.logAudit)({
                req,
                action: 'ROOM_CREATED',
                entityType: 'Room',
                entityId: room._id.toString(),
                changes: { after: { roomNumber: room.roomNumber } },
            });
            (0, response_1.sendSuccess)(res, room, 'Room created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async adminUpdateRoom(req, res, next) {
        try {
            const id = req.params.id;
            const beforeRoom = await Room_1.Room.findById(id);
            if (!beforeRoom) {
                throw new errors_1.NotFoundError('Room not found');
            }
            const updatedRoom = await Room_1.Room.findByIdAndUpdate(id, { $set: req.body }, { new: true });
            await (0, audit_1.logAudit)({
                req,
                action: 'ROOM_UPDATED',
                entityType: 'Room',
                entityId: id,
                changes: { before: beforeRoom.toObject(), after: updatedRoom?.toObject() },
            });
            (0, response_1.sendSuccess)(res, updatedRoom, 'Room updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async adminAddMaintenance(req, res, next) {
        try {
            const id = req.params.id;
            const { startDate, endDate, reason } = req.body;
            if (startDate >= endDate) {
                throw new errors_1.BadRequestError('startDate must be before endDate');
            }
            const room = await Room_1.Room.findById(id);
            if (!room) {
                throw new errors_1.NotFoundError('Room not found');
            }
            // Check if room has active bookings during this maintenance window
            const conflictingBooking = await Booking_1.Booking.findOne({
                assignedRoomId: room._id,
                reservationStatus: { $in: ['CONFIRMED', 'PENDING_PAYMENT', 'HELD'] },
                checkInDate: { $lt: endDate },
                checkOutDate: { $gt: startDate },
            });
            if (conflictingBooking) {
                throw new errors_1.BadRequestError(`Cannot schedule maintenance: Overlaps with confirmed reservation ${conflictingBooking.bookingReference}`);
            }
            room.maintenanceInfo.push({
                startDate,
                endDate,
                reason,
                blockedBy: new mongoose_1.default.Types.ObjectId(req.user.id),
            });
            await room.save();
            await (0, audit_1.logAudit)({
                req,
                action: 'MAINTENANCE_BLOCK_ADDED',
                entityType: 'Room',
                entityId: room._id.toString(),
                changes: { after: { startDate, endDate, reason } },
            });
            (0, response_1.sendSuccess)(res, room, 'Maintenance block added successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async adminRemoveMaintenance(req, res, next) {
        try {
            const id = req.params.id;
            const { maintenanceId } = req.query;
            const room = await Room_1.Room.findById(id);
            if (!room) {
                throw new errors_1.NotFoundError('Room not found');
            }
            if (maintenanceId) {
                room.maintenanceInfo = room.maintenanceInfo.filter((m) => m._id.toString() !== maintenanceId);
            }
            else {
                // Clear all expired or all blocks if none specified
                room.maintenanceInfo = [];
            }
            await room.save();
            await (0, audit_1.logAudit)({
                req,
                action: 'MAINTENANCE_BLOCK_REMOVED',
                entityType: 'Room',
                entityId: room._id.toString(),
            });
            (0, response_1.sendSuccess)(res, room, 'Maintenance block removed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    // --- Admin Room Type & Rates ---
    static async adminCreateRoomType(req, res, next) {
        try {
            const roomType = await RoomType_1.RoomType.create(req.body);
            // Auto-create initial default rate plan for this room type
            await RatePlan_1.RatePlan.create({
                roomTypeId: roomType._id,
                defaultRate: roomType.defaultNightlyRate,
                currency: 'INR',
                isActive: true,
            });
            (0, response_1.sendSuccess)(res, roomType, 'Room type created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async adminUpdateRoomType(req, res, next) {
        try {
            const id = req.params.id;
            const roomType = await RoomType_1.RoomType.findByIdAndUpdate(id, { $set: req.body }, { new: true });
            if (!roomType)
                throw new errors_1.NotFoundError('Room type not found');
            (0, response_1.sendSuccess)(res, roomType, 'Room type updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async adminUpdateRatePlan(req, res, next) {
        try {
            const id = req.params.id;
            const ratePlan = await RatePlan_1.RatePlan.findByIdAndUpdate(id, { $set: req.body }, { new: true });
            if (!ratePlan)
                throw new errors_1.NotFoundError('Rate plan not found');
            (0, response_1.sendSuccess)(res, ratePlan, 'Rate plan updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RoomController = RoomController;
//# sourceMappingURL=room.controller.js.map