"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_service_1 = require("../services/booking.service");
const Booking_1 = require("../models/Booking");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
class BookingController {
    static async createHold(req, res, next) {
        try {
            const idempotencyKey = req.header('Idempotency-Key');
            const result = await booking_service_1.BookingService.createHold({
                ...req.body,
                idempotencyKey,
            });
            (0, response_1.sendSuccess)(res, {
                holdId: result.hold._id,
                holdToken: result.holdToken,
                roomId: result.hold.roomId,
                checkInDate: result.hold.checkInDate,
                checkOutDate: result.hold.checkOutDate,
                expiresAt: result.expiresAt,
                pricing: result.pricing,
            }, 'Room hold created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async createBooking(req, res, next) {
        try {
            const idempotencyKey = req.header('Idempotency-Key');
            const result = await booking_service_1.BookingService.createBooking({
                ...req.body,
                idempotencyKey,
                source: types_1.BookingSource.WEBSITE,
            });
            (0, response_1.sendSuccess)(res, {
                bookingReference: result.booking.bookingReference,
                reservationStatus: result.booking.reservationStatus,
                paymentStatus: result.booking.paymentStatus,
                stayStatus: result.booking.stayStatus,
                checkInDate: result.booking.checkInDate,
                checkOutDate: result.booking.checkOutDate,
                numberOfGuests: result.booking.numberOfGuests,
                totalAmount: result.booking.totalAmount,
                currency: result.booking.currency,
                pricing: result.pricing,
                qrToken: result.qrToken,
                qrCheckInUrl: `/checkin?token=${result.qrToken}`,
            }, 'Booking created and confirmed successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async getBooking(req, res, next) {
        try {
            const reference = req.params.reference;
            const { email, mobile } = req.query;
            const isStaff = Boolean(req.user);
            const booking = await booking_service_1.BookingService.getBookingByReference(reference, { email, mobile }, isStaff);
            (0, response_1.sendSuccess)(res, booking, 'Booking details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async cancelBooking(req, res, next) {
        try {
            const reference = req.params.reference;
            const { reason } = req.body;
            const cancelled = await booking_service_1.BookingService.cancelBooking(reference, reason, req.user?.id, Boolean(req.user));
            (0, response_1.sendSuccess)(res, cancelled, 'Booking cancelled successfully');
        }
        catch (error) {
            next(error);
        }
    }
    // --- Admin Booking Handlers ---
    static async adminListBookings(req, res, next) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
            const skip = (page - 1) * limit;
            const filter = {};
            if (req.query.status) {
                filter.reservationStatus = req.query.status;
            }
            if (req.query.stayStatus) {
                filter.stayStatus = req.query.stayStatus;
            }
            if (req.query.checkInDate) {
                filter.checkInDate = req.query.checkInDate;
            }
            if (req.query.search) {
                const search = String(req.query.search).trim();
                filter.$or = [
                    { bookingReference: { $regex: search, $options: 'i' } },
                ];
            }
            const total = await Booking_1.Booking.countDocuments(filter);
            const bookings = await Booking_1.Booking.find(filter)
                .populate('guestId', 'fullName email mobile')
                .populate('assignedRoomId', 'roomNumber floor')
                .populate('roomTypeId', 'name code category')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            (0, response_1.sendSuccess)(res, bookings, 'Bookings retrieved', 200, {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async adminCreateBooking(req, res, next) {
        try {
            const idempotencyKey = req.header('Idempotency-Key');
            const result = await booking_service_1.BookingService.createBooking({
                ...req.body,
                source: req.body.source || types_1.BookingSource.FRONT_DESK,
                createdBy: req.user.id,
                idempotencyKey,
            });
            (0, response_1.sendSuccess)(res, {
                booking: result.booking,
                pricing: result.pricing,
                qrToken: result.qrToken,
            }, 'Staff reservation created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async adminUpdateBooking(req, res, next) {
        try {
            const { id } = req.params;
            const { specialRequests, paymentStatus, numberOfGuests } = req.body;
            const booking = await Booking_1.Booking.findById(id);
            if (!booking) {
                throw new errors_1.NotFoundError('Booking not found');
            }
            if (specialRequests !== undefined)
                booking.specialRequests = specialRequests;
            if (paymentStatus !== undefined)
                booking.paymentStatus = paymentStatus;
            if (numberOfGuests !== undefined)
                booking.numberOfGuests = numberOfGuests;
            await booking.save();
            (0, response_1.sendSuccess)(res, booking, 'Booking updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async adminCancelBooking(req, res, next) {
        try {
            const id = req.params.id;
            const { reason } = req.body;
            const cancelled = await booking_service_1.BookingService.cancelBooking(id, reason || 'Staff Cancellation', req.user.id, true);
            (0, response_1.sendSuccess)(res, cancelled, 'Booking cancelled by staff successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BookingController = BookingController;
//# sourceMappingURL=booking.controller.js.map