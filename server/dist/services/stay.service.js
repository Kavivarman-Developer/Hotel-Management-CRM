"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StayService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
const Room_1 = require("../models/Room");
const StayRecord_1 = require("../models/StayRecord");
const GuestRegistration_1 = require("../models/GuestRegistration");
const database_1 = require("../config/database");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
const policy_service_1 = require("./policy.service");
class StayService {
    /**
     * Complete digital / front-desk check-in
     */
    static async checkIn(input) {
        const { bookingId, staffUserId, roomId, bypassRegistrationCheck = false, notes } = input;
        return await (0, database_1.withTransaction)(async (session) => {
            const booking = await Booking_1.Booking.findById(bookingId).session(session);
            if (!booking) {
                throw new errors_1.NotFoundError('Booking not found');
            }
            if (booking.reservationStatus !== types_1.ReservationStatus.CONFIRMED) {
                throw new errors_1.BadRequestError(`Cannot check in. Booking status is ${booking.reservationStatus}`);
            }
            if (booking.stayStatus === types_1.StayStatus.CHECKED_IN) {
                throw new errors_1.ConflictError('Guest is already checked in for this booking');
            }
            if (booking.stayStatus === types_1.StayStatus.CHECKED_OUT) {
                throw new errors_1.BadRequestError('Booking has already completed check-out');
            }
            // Check registration verification status unless staff bypassed with audit
            if (!bypassRegistrationCheck) {
                const registration = await GuestRegistration_1.GuestRegistration.findOne({ bookingId: booking._id }).session(session);
                if (registration && registration.verificationStatus === types_1.RegistrationStatus.REJECTED) {
                    throw new errors_1.BadRequestError('Guest registration was rejected. Identity verification required.');
                }
            }
            // Target Room
            const effectiveRoomId = roomId ? new mongoose_1.default.Types.ObjectId(roomId) : booking.assignedRoomId;
            const room = await Room_1.Room.findById(effectiveRoomId).session(session);
            if (!room) {
                throw new errors_1.NotFoundError('Assigned room not found');
            }
            // If staff reallocated room during check-in, update booking
            if (roomId && !booking.assignedRoomId.equals(effectiveRoomId)) {
                booking.assignedRoomId = effectiveRoomId;
            }
            // Update room housekeeping and operational status
            room.housekeepingStatus = types_1.HousekeepingStatus.CLEAN;
            await room.save({ session });
            // Update booking stay status
            booking.stayStatus = types_1.StayStatus.CHECKED_IN;
            await booking.save({ session });
            // Create or update StayRecord
            let stay = await StayRecord_1.StayRecord.findOne({ bookingId: booking._id }).session(session);
            if (!stay) {
                stay = new StayRecord_1.StayRecord({
                    bookingId: booking._id,
                    roomId: effectiveRoomId,
                    actualCheckInTimestamp: new Date(),
                    checkedInBy: new mongoose_1.default.Types.ObjectId(staffUserId),
                    stayStatus: 'ACTIVE',
                    notes,
                });
            }
            else {
                stay.actualCheckInTimestamp = new Date();
                stay.checkedInBy = new mongoose_1.default.Types.ObjectId(staffUserId);
                stay.stayStatus = 'ACTIVE';
                if (notes)
                    stay.notes = notes;
            }
            await stay.save({ session });
            await (0, audit_1.logAudit)({
                action: 'STAY_CHECKED_IN',
                entityType: 'StayRecord',
                entityId: stay._id.toString(),
                userId: staffUserId,
                changes: {
                    after: {
                        bookingReference: booking.bookingReference,
                        roomNumber: room.roomNumber,
                        actualCheckInTimestamp: stay.actualCheckInTimestamp,
                        bypassedVerification: bypassRegistrationCheck,
                    },
                },
            });
            return { stay, booking };
        });
    }
    /**
     * Complete check-out, record final billing, and set room to DIRTY for housekeeping
     */
    static async checkOut(input) {
        const { stayId, staffUserId, additionalCharges = [], autoCalculateOverstay = true, finalPaidAmount, notes } = input;
        return await (0, database_1.withTransaction)(async (session) => {
            const stay = await StayRecord_1.StayRecord.findById(stayId).session(session);
            if (!stay) {
                throw new errors_1.NotFoundError('Stay record not found');
            }
            if (stay.stayStatus === 'COMPLETED') {
                throw new errors_1.ConflictError('Check-out has already been completed for this stay');
            }
            const booking = await Booking_1.Booking.findById(stay.bookingId).session(session);
            if (!booking) {
                throw new errors_1.NotFoundError('Associated booking not found');
            }
            const room = await Room_1.Room.findById(stay.roomId).session(session);
            if (!room) {
                throw new errors_1.NotFoundError('Associated room not found');
            }
            // Automatically calculate overstay / late check-out fee if past 11:00 AM on check-out date
            if (autoCalculateOverstay) {
                const dailyRate = booking.nightlyPriceBreakdown?.[0]?.totalNightRate ||
                    Math.round(booking.subtotal / Math.max(1, booking.numberOfGuests)) ||
                    250000;
                const overstay = policy_service_1.HotelPolicyService.calculateOverstay(booking.checkOutDate, dailyRate, new Date());
                const alreadyHasOverstay = additionalCharges.some((c) => c.category === 'OVERSTAY');
                if (overstay.hasOverstay && overstay.feePaise > 0 && !alreadyHasOverstay) {
                    additionalCharges.push({
                        description: overstay.rateDescription,
                        amount: overstay.feePaise,
                        category: 'OVERSTAY',
                    });
                }
            }
            // Add any additional charges (mini-bar, room service, laundry, damage, overstay)
            for (const chg of additionalCharges) {
                stay.additionalCharges.push({
                    description: chg.description,
                    amount: chg.amount,
                    category: chg.category,
                    addedBy: new mongoose_1.default.Types.ObjectId(staffUserId),
                    addedAt: new Date(),
                });
                booking.extraCharges += chg.amount;
                booking.totalAmount += chg.amount;
            }
            // Final bill reference
            const billRef = `BILL-${booking.bookingReference}`;
            stay.actualCheckOutTimestamp = new Date();
            stay.checkedOutBy = new mongoose_1.default.Types.ObjectId(staffUserId);
            stay.stayStatus = 'COMPLETED';
            stay.finalBillReference = billRef;
            if (finalPaidAmount !== undefined) {
                stay.finalPaidAmount = finalPaidAmount;
            }
            if (notes)
                stay.notes = notes;
            await stay.save({ session });
            // Update Booking
            booking.stayStatus = types_1.StayStatus.CHECKED_OUT;
            booking.paymentStatus = types_1.PaymentStatus.PAID;
            await booking.save({ session });
            // Set Room housekeeping status to DIRTY (needs cleaning before next guest)
            room.housekeepingStatus = types_1.HousekeepingStatus.DIRTY;
            await room.save({ session });
            await (0, audit_1.logAudit)({
                action: 'STAY_CHECKED_OUT',
                entityType: 'StayRecord',
                entityId: stay._id.toString(),
                userId: staffUserId,
                changes: {
                    after: {
                        bookingReference: booking.bookingReference,
                        roomNumber: room.roomNumber,
                        actualCheckOutTimestamp: stay.actualCheckOutTimestamp,
                        housekeepingStatus: types_1.HousekeepingStatus.DIRTY,
                        finalBillReference: billRef,
                    },
                },
            });
            return { stay, booking };
        });
    }
    /**
     * Preview real-time overstay charges for a currently active stay
     */
    static async getOverstayPreview(stayId) {
        const stay = await StayRecord_1.StayRecord.findById(stayId);
        if (!stay) {
            throw new errors_1.NotFoundError('Stay record not found');
        }
        const booking = await Booking_1.Booking.findById(stay.bookingId);
        if (!booking) {
            throw new errors_1.NotFoundError('Associated booking not found');
        }
        const dailyRate = booking.nightlyPriceBreakdown?.[0]?.totalNightRate ||
            Math.round(booking.subtotal / Math.max(1, booking.numberOfGuests)) ||
            250000;
        return policy_service_1.HotelPolicyService.calculateOverstay(booking.checkOutDate, dailyRate, new Date());
    }
}
exports.StayService = StayService;
//# sourceMappingURL=stay.service.js.map