"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtraStayService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ExtraStayRequest_1 = require("../models/ExtraStayRequest");
const Booking_1 = require("../models/Booking");
const StayRecord_1 = require("../models/StayRecord");
const Room_1 = require("../models/Room");
const Guest_1 = require("../models/Guest");
const socket_1 = require("../socket");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
class ExtraStayService {
    /**
     * Guest or Front Desk submits an extra stay / late checkout extension request
     */
    static async createRequest(input) {
        const { bookingReference, requestedExtraHours, reason } = input;
        const normalizedRef = bookingReference.toUpperCase().trim();
        const booking = await Booking_1.Booking.findOne({ bookingReference: normalizedRef });
        if (!booking) {
            throw new errors_1.NotFoundError(`Booking '${normalizedRef}' not found`);
        }
        if (booking.reservationStatus === 'CANCELLED') {
            throw new errors_1.BadRequestError('Cannot request extra stay for a cancelled booking');
        }
        if (booking.stayStatus === 'CHECKED_OUT') {
            throw new errors_1.BadRequestError('Guest has already checked out of the hotel');
        }
        // Lookup room and guest
        const room = await Room_1.Room.findById(booking.assignedRoomId);
        const guest = await Guest_1.Guest.findById(booking.guestId);
        const roomNumber = room?.roomNumber ? String(room.roomNumber) : 'Assigned Room';
        const guestName = guest?.fullName || 'Guest';
        const guestMobile = guest?.mobile || '+91 8110018708';
        // Standard hourly rate: ₹200 per hour (20,000 paise)
        const hourlyRatePaise = 20000;
        const chargeAmountPaise = requestedExtraHours * hourlyRatePaise;
        // Calculate new expected departure time
        // Standard hotel check-out is 11:00 AM
        const standardCheckoutHour = 11;
        const newHour = standardCheckoutHour + requestedExtraHours;
        const period = newHour >= 12 && newHour < 24 ? 'PM' : 'AM';
        const displayHour = newHour > 12 ? newHour - 12 : newHour === 0 ? 12 : newHour;
        const newExpectedCheckOutTime = `${String(displayHour).padStart(2, '0')}:00 ${period}`;
        // Associated active stay record if in-house
        const stay = await StayRecord_1.StayRecord.findOne({ bookingId: booking._id, stayStatus: 'ACTIVE' });
        const request = new ExtraStayRequest_1.ExtraStayRequest({
            bookingId: booking._id,
            stayId: stay?._id,
            bookingReference: normalizedRef,
            guestName,
            guestMobile,
            roomNumber,
            currentCheckOutDate: booking.checkOutDate,
            currentCheckOutTime: '11:00 AM',
            requestedExtraHours,
            newExpectedCheckOutTime,
            reason,
            hourlyRatePaise,
            chargeAmountPaise,
            status: 'PENDING',
            paymentStatus: 'PENDING',
        });
        await request.save();
        // Broadcast in real-time to front desk and admin dashboard
        try {
            (0, socket_1.emitToAdmin)('extra_stay:new_request', {
                id: request._id,
                bookingReference: normalizedRef,
                guestName,
                guestMobile,
                roomNumber,
                requestedExtraHours,
                newExpectedCheckOutTime,
                reason,
                chargeAmountPaise,
                chargeAmountRupees: Math.round(chargeAmountPaise / 100),
                createdAt: request.createdAt,
            });
            (0, socket_1.emitToAdmin)('notification:new', {
                id: `notif_${Date.now()}`,
                type: 'EXTRA_STAY_REQUEST',
                title: `Extra Stay Request — Room ${roomNumber}`,
                message: `${guestName} requested +${requestedExtraHours} hrs extension (${newExpectedCheckOutTime}). Reason: ${reason}`,
                timestamp: new Date(),
                link: '/admin/extra-stays',
            });
        }
        catch (err) {
            console.warn('Socket broadcast warning:', err.message);
        }
        return request;
    }
    /**
     * List all extra stay requests with filter, pagination & stats
     */
    static async listRequests(filter = {}, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const query = {};
        if (filter.status && filter.status !== 'ALL') {
            query.status = filter.status;
        }
        if (filter.search) {
            query.$or = [
                { bookingReference: { $regex: filter.search, $options: 'i' } },
                { guestName: { $regex: filter.search, $options: 'i' } },
                { roomNumber: { $regex: filter.search, $options: 'i' } },
                { guestMobile: { $regex: filter.search, $options: 'i' } },
            ];
        }
        const [requests, total, allRequests] = await Promise.all([
            ExtraStayRequest_1.ExtraStayRequest.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('bookingId')
                .populate('actionedBy', 'name email'),
            ExtraStayRequest_1.ExtraStayRequest.countDocuments(query),
            ExtraStayRequest_1.ExtraStayRequest.find().select('status chargeAmountPaise'),
        ]);
        const pending = allRequests.filter((r) => r.status === 'PENDING').length;
        const approved = allRequests.filter((r) => r.status === 'APPROVED').length;
        const rejected = allRequests.filter((r) => r.status === 'REJECTED').length;
        const totalRevenuePaise = allRequests
            .filter((r) => r.status === 'APPROVED')
            .reduce((sum, r) => sum + (r.chargeAmountPaise || 0), 0);
        return {
            requests,
            total,
            stats: {
                pending,
                approved,
                rejected,
                totalRevenuePaise,
            },
        };
    }
    /**
     * Approve an extra stay request and append charge to Folio / StayRecord
     */
    static async approveRequest(id, staffUserId, addToFolio = true, staffNotes) {
        const request = await ExtraStayRequest_1.ExtraStayRequest.findById(id);
        if (!request) {
            throw new errors_1.NotFoundError('Extra stay request not found');
        }
        if (request.status !== 'PENDING') {
            throw new errors_1.BadRequestError(`Request is already ${request.status}`);
        }
        request.status = 'APPROVED';
        request.actionedBy = new mongoose_1.default.Types.ObjectId(staffUserId);
        request.actionedAt = new Date();
        if (staffNotes)
            request.staffNotes = staffNotes;
        // Add incidental to StayRecord and Booking if requested
        if (addToFolio) {
            request.paymentStatus = 'ADDED_TO_FOLIO';
            const booking = await Booking_1.Booking.findById(request.bookingId);
            if (booking) {
                booking.extraCharges = (booking.extraCharges || 0) + request.chargeAmountPaise;
                booking.totalAmount = (booking.totalAmount || 0) + request.chargeAmountPaise;
                await booking.save();
            }
            // If active stay exists, add charge item
            const stay = await StayRecord_1.StayRecord.findOne({
                bookingId: request.bookingId,
                stayStatus: 'ACTIVE',
            });
            if (stay) {
                stay.additionalCharges.push({
                    description: `Approved Extension: +${request.requestedExtraHours} hrs past 11:00 AM (${request.newExpectedCheckOutTime})`,
                    amount: request.chargeAmountPaise,
                    category: 'OVERSTAY',
                    addedBy: new mongoose_1.default.Types.ObjectId(staffUserId),
                    addedAt: new Date(),
                });
                await stay.save();
            }
        }
        await request.save();
        await (0, audit_1.logAudit)({
            action: 'EXTRA_STAY_APPROVED',
            entityType: 'ExtraStayRequest',
            entityId: request._id.toString(),
            userId: staffUserId,
            changes: {
                after: {
                    bookingReference: request.bookingReference,
                    roomNumber: request.roomNumber,
                    hours: request.requestedExtraHours,
                    newCheckOut: request.newExpectedCheckOutTime,
                    fee: request.chargeAmountPaise,
                },
            },
        });
        // Notify guest in real-time
        try {
            (0, socket_1.emitToGuest)(request.bookingReference, 'extra_stay:updated', {
                status: 'APPROVED',
                newExpectedCheckOutTime: request.newExpectedCheckOutTime,
                chargeAmountPaise: request.chargeAmountPaise,
                message: `Your extra stay request for +${request.requestedExtraHours} hours has been APPROVED by the front desk. New check-out time is ${request.newExpectedCheckOutTime}.`,
            });
            (0, socket_1.emitToAdmin)('extra_stay:updated', request);
        }
        catch (err) {
            // non-blocking
        }
        return request;
    }
    /**
     * Reject an extra stay request with explanation
     */
    static async rejectRequest(id, staffUserId, rejectionReason) {
        const request = await ExtraStayRequest_1.ExtraStayRequest.findById(id);
        if (!request) {
            throw new errors_1.NotFoundError('Extra stay request not found');
        }
        request.status = 'REJECTED';
        request.rejectionReason = rejectionReason;
        request.actionedBy = new mongoose_1.default.Types.ObjectId(staffUserId);
        request.actionedAt = new Date();
        await request.save();
        // Real-time notification to guest
        try {
            (0, socket_1.emitToGuest)(request.bookingReference, 'extra_stay:updated', {
                status: 'REJECTED',
                rejectionReason,
                message: `Your extra stay request could not be approved. Reason: ${rejectionReason}. Please prepare for scheduled check-out at 11:00 AM.`,
            });
            (0, socket_1.emitToAdmin)('extra_stay:updated', request);
        }
        catch (err) {
            // non-blocking
        }
        return request;
    }
    /**
     * Check status of requests for a specific booking reference
     */
    static async getRequestsForBooking(bookingReference) {
        return await ExtraStayRequest_1.ExtraStayRequest.find({
            bookingReference: bookingReference.toUpperCase().trim(),
        }).sort({ createdAt: -1 });
    }
}
exports.ExtraStayService = ExtraStayService;
//# sourceMappingURL=extraStay.service.js.map