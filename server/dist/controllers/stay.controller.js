"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StayController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const stay_service_1 = require("../services/stay.service");
const StayRecord_1 = require("../models/StayRecord");
const Booking_1 = require("../models/Booking");
const Room_1 = require("../models/Room");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
const socket_1 = require("../socket");
class StayController {
    /**
     * List expected arrivals (confirmed bookings pending check-in)
     */
    static async listArrivals(req, res, next) {
        try {
            const arrivals = await Booking_1.Booking.find({
                reservationStatus: types_1.ReservationStatus.CONFIRMED,
                stayStatus: types_1.StayStatus.NOT_CHECKED_IN,
            })
                .populate('guestId', 'fullName email mobile nationality')
                .populate('assignedRoomId', 'roomNumber floor housekeepingStatus isOccupied')
                .populate('roomTypeId', 'name code baseRate')
                .sort({ checkInDate: 1, createdAt: -1 });
            (0, response_1.sendSuccess)(res, arrivals, 'Expected arrivals retrieved', 200);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Complete check-in for a booking or existing stay record
     */
    static async checkIn(req, res, next) {
        try {
            const id = req.params.id; // bookingId or stayId
            const { roomId, bypassRegistrationCheck, notes } = req.body;
            // Determine if id is bookingId or stayId
            let bookingId = id;
            if (mongoose_1.default.Types.ObjectId.isValid(id)) {
                const stay = await StayRecord_1.StayRecord.findById(id);
                if (stay) {
                    bookingId = stay.bookingId.toString();
                }
            }
            const result = await stay_service_1.StayService.checkIn({
                bookingId,
                staffUserId: req.user.id,
                roomId,
                bypassRegistrationCheck,
                notes,
            });
            // Real-time notification to PMS
            try {
                const room = await Room_1.Room.findById(result.booking.assignedRoomId);
                (0, socket_1.emitToAdmin)('stay:checked_in', {
                    stayId: result.stay._id,
                    bookingReference: result.booking.bookingReference,
                    roomNumber: room?.roomNumber,
                    guestName: result.booking?.guestId?.fullName || 'Guest',
                    checkInTimestamp: result.stay.actualCheckInTimestamp,
                });
                (0, socket_1.emitToAdmin)('notification:new', {
                    id: `notif_${Date.now()}`,
                    type: 'CHECK_IN',
                    title: `Guest Checked In — Room ${room?.roomNumber || ''}`,
                    message: `Booking ${result.booking.bookingReference} checked into Room ${room?.roomNumber || 'Assigned'}. Key issued.`,
                    timestamp: new Date(),
                    link: '/admin/stays',
                });
            }
            catch (err) {
                console.warn('Socket notification error:', err.message);
            }
            (0, response_1.sendSuccess)(res, result, 'Guest checked in successfully', 200);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Complete check-out, record charges, release room
     */
    static async checkOut(req, res, next) {
        try {
            const id = req.params.id; // stayId
            const { additionalCharges = [], minibarCharges = 0, damageCharges = 0, lateCheckoutFee = 0, autoCalculateOverstay = true, finalPaidAmount, notes, } = req.body;
            // Format charges into structure expected by StayService
            const formattedCharges = [...(Array.isArray(additionalCharges) ? additionalCharges : [])];
            if (minibarCharges > 0) {
                formattedCharges.push({
                    description: 'Minibar / In-Room Dining Charges',
                    amount: minibarCharges,
                    category: 'MINI_BAR',
                });
            }
            if (damageCharges > 0) {
                formattedCharges.push({
                    description: 'Room Damage / Repair Assessment',
                    amount: damageCharges,
                    category: 'DAMAGE',
                });
            }
            if (lateCheckoutFee > 0) {
                formattedCharges.push({
                    description: 'Late Check-Out / Overstay Incidental Fee',
                    amount: lateCheckoutFee,
                    category: 'OVERSTAY',
                });
            }
            const result = await stay_service_1.StayService.checkOut({
                stayId: id,
                staffUserId: req.user.id,
                additionalCharges: formattedCharges,
                autoCalculateOverstay,
                finalPaidAmount,
                notes,
            });
            // Real-time broadcast
            try {
                const room = await Room_1.Room.findById(result.booking.assignedRoomId);
                (0, socket_1.emitToAdmin)('stay:checked_out', {
                    stayId: result.stay._id,
                    bookingReference: result.booking.bookingReference,
                    roomNumber: room?.roomNumber,
                    checkOutTimestamp: result.stay.actualCheckOutTimestamp,
                    finalBillReference: result.stay.finalBillReference,
                });
                (0, socket_1.emitToAdmin)('notification:new', {
                    id: `notif_${Date.now()}`,
                    type: 'CHECK_OUT',
                    title: `Guest Departed — Room ${room?.roomNumber || ''}`,
                    message: `Booking ${result.booking.bookingReference} checked out. Room ${room?.roomNumber || ''} marked DIRTY for housekeeping.`,
                    timestamp: new Date(),
                    link: '/admin/stays',
                });
            }
            catch (err) {
                console.warn('Socket notification error:', err.message);
            }
            (0, response_1.sendSuccess)(res, result, 'Guest checked out successfully and room flagged for housekeeping', 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getOverstayPreview(req, res, next) {
        try {
            const id = req.params.id;
            const result = await stay_service_1.StayService.getOverstayPreview(id);
            (0, response_1.sendSuccess)(res, result, 'Overstay calculation retrieved', 200);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List stays with status translation and deep population
     */
    static async listStays(req, res, next) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
            const skip = (page - 1) * limit;
            const filter = {};
            if (req.query.status) {
                const s = String(req.query.status).toUpperCase();
                if (s === 'CHECKED_IN' || s === 'ACTIVE') {
                    filter.stayStatus = 'ACTIVE';
                }
                else if (s === 'CHECKED_OUT' || s === 'COMPLETED') {
                    filter.stayStatus = 'COMPLETED';
                }
                else if (s !== 'ALL') {
                    filter.stayStatus = req.query.status;
                }
            }
            const [total, stays, inHouseCount, departedCount, arrivalsCount] = await Promise.all([
                StayRecord_1.StayRecord.countDocuments(filter),
                StayRecord_1.StayRecord.find(filter)
                    .populate({
                    path: 'bookingId',
                    populate: [
                        { path: 'guestId', select: 'fullName email mobile nationality' },
                        { path: 'roomTypeId', select: 'name code baseRate' },
                    ],
                })
                    .populate('roomId', 'roomNumber floor housekeepingStatus isOccupied')
                    .populate('checkedInBy', 'name email')
                    .populate('checkedOutBy', 'name email')
                    .sort({ actualCheckInTimestamp: -1 })
                    .skip(skip)
                    .limit(limit),
                StayRecord_1.StayRecord.countDocuments({ stayStatus: 'ACTIVE' }),
                StayRecord_1.StayRecord.countDocuments({ stayStatus: 'COMPLETED' }),
                Booking_1.Booking.countDocuments({
                    reservationStatus: types_1.ReservationStatus.CONFIRMED,
                    stayStatus: types_1.StayStatus.NOT_CHECKED_IN,
                }),
            ]);
            (0, response_1.sendSuccess)(res, stays, 'Stays retrieved', 200, {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                counts: {
                    arrivals: arrivalsCount,
                    inHouse: inHouseCount,
                    departed: departedCount,
                    all: total,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getStay(req, res, next) {
        try {
            const id = req.params.id;
            const stay = await StayRecord_1.StayRecord.findById(id)
                .populate({
                path: 'bookingId',
                populate: [
                    { path: 'guestId' },
                    { path: 'roomTypeId' },
                ],
            })
                .populate('roomId')
                .populate('checkedInBy', 'name email')
                .populate('checkedOutBy', 'name email');
            if (!stay) {
                throw new errors_1.NotFoundError('Stay record not found');
            }
            (0, response_1.sendSuccess)(res, stay, 'Stay details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Add incidental charge to active stay
     */
    static async addCharge(req, res, next) {
        try {
            const id = req.params.id;
            const { description, amount, category = 'OTHER' } = req.body;
            if (!description || !amount || amount <= 0) {
                throw new errors_1.BadRequestError('Valid charge description and positive amount are required');
            }
            const stay = await StayRecord_1.StayRecord.findById(id);
            if (!stay) {
                throw new errors_1.NotFoundError('Stay record not found');
            }
            if (stay.stayStatus !== 'ACTIVE') {
                throw new errors_1.BadRequestError('Cannot add charges to completed stay');
            }
            stay.additionalCharges.push({
                description,
                amount: Number(amount),
                category,
                addedBy: new mongoose_1.default.Types.ObjectId(req.user.id),
                addedAt: new Date(),
            });
            await stay.save();
            const booking = await Booking_1.Booking.findById(stay.bookingId);
            if (booking) {
                booking.extraCharges = (booking.extraCharges || 0) + Number(amount);
                booking.totalAmount = (booking.totalAmount || 0) + Number(amount);
                await booking.save();
            }
            (0, response_1.sendSuccess)(res, stay, 'Incidental charge added successfully', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StayController = StayController;
//# sourceMappingURL=stay.controller.js.map