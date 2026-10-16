"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
const Room_1 = require("../models/Room");
const RoomType_1 = require("../models/RoomType");
const RatePlan_1 = require("../models/RatePlan");
const RoomHold_1 = require("../models/RoomHold");
const RoomInventoryLock_1 = require("../models/RoomInventoryLock");
const Guest_1 = require("../models/Guest");
const GuestRegistration_1 = require("../models/GuestRegistration");
const PropertySettings_1 = require("../models/PropertySettings");
const Voucher_1 = require("../models/Voucher");
const voucher_service_1 = require("./voucher.service");
const socket_1 = require("../socket");
const pricing_service_1 = require("./pricing.service");
const availability_service_1 = require("./availability.service");
const policy_service_1 = require("./policy.service");
const database_1 = require("../config/database");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
class RoomMutex {
    static locks = new Map();
    static async runWithLock(key, fn) {
        while (this.locks.has(key)) {
            await this.locks.get(key);
        }
        let resolveLock;
        const lockPromise = new Promise((resolve) => {
            resolveLock = resolve;
        });
        this.locks.set(key, lockPromise);
        try {
            return await fn();
        }
        finally {
            this.locks.delete(key);
            resolveLock();
        }
    }
}
class BookingService {
    /**
     * Generates a human-friendly unique booking reference: GOR-YYYYMMDD-XXXX
     */
    static generateBookingReference(date = new Date()) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const randomHex = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
        return `GOR-${y}${m}${d}-${randomHex}`;
    }
    /**
     * Generates a cryptographically secure token and its SHA-256 hash.
     */
    static generateSecureToken() {
        const rawToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
        return { rawToken, hashedToken };
    }
    /**
     * Hashes a raw token for lookup.
     */
    static hashToken(rawToken) {
        return crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
    }
    /**
     * Step 1: Create a temporary room hold with full concurrency control.
     */
    static async createHold(input) {
        const { roomTypeId, checkInDate, checkOutDate, numberOfGuests, discountCode, specificRoomId, idempotencyKey } = input;
        if (checkInDate >= checkOutDate) {
            throw new errors_1.BadRequestError('checkInDate must be strictly before checkOutDate');
        }
        const lockKey = String(specificRoomId || roomTypeId);
        return await RoomMutex.runWithLock(lockKey, async () => {
            return await (0, database_1.withTransaction)(async (session) => {
                // 1. Validate Room Type and Rate Plan
                const roomType = await RoomType_1.RoomType.findById(roomTypeId).session(session);
                if (!roomType || !roomType.isActive) {
                    throw new errors_1.NotFoundError('Selected room type not found or inactive');
                }
                if (roomType.maxOccupancy.total < numberOfGuests) {
                    throw new errors_1.BadRequestError(`Room capacity (${roomType.maxOccupancy.total}) is less than guests (${numberOfGuests})`);
                }
                const ratePlan = await RatePlan_1.RatePlan.findOne({ roomTypeId: roomType._id, isActive: true }).session(session);
                if (!ratePlan) {
                    throw new errors_1.BadRequestError('No active rate plan found for this room type');
                }
                // 2. Fetch candidate physical rooms
                const query = {
                    roomTypeId: roomType._id,
                    status: types_1.RoomStatus.ACTIVE,
                };
                if (specificRoomId) {
                    query._id = new mongoose_1.default.Types.ObjectId(specificRoomId);
                }
                const candidateRooms = await Room_1.Room.find(query).session(session);
                if (candidateRooms.length === 0) {
                    throw new errors_1.RoomUnavailableError();
                }
                // Find an available room that is free from overlapping bookings, unexpired holds, and maintenance
                let selectedRoom = null;
                for (const room of candidateRooms) {
                    // Shared inventory-control write
                    await RoomInventoryLock_1.RoomInventoryLock.findOneAndUpdate({ roomId: room._id }, { $inc: { version: 1 }, $set: { lastLockedAt: new Date(), lockedByOperation: 'HOLD_CREATION' } }, { session, upsert: true, new: true });
                    // Recheck overlapping bookings
                    const hasBooking = await Booking_1.Booking.exists({
                        assignedRoomId: room._id,
                        reservationStatus: {
                            $in: [types_1.ReservationStatus.CONFIRMED, types_1.ReservationStatus.PENDING_PAYMENT, types_1.ReservationStatus.HELD],
                        },
                        checkInDate: { $lt: checkOutDate },
                        checkOutDate: { $gt: checkInDate },
                    }).session(session);
                    if (hasBooking)
                        continue;
                    // Recheck active unexpired holds
                    const hasHold = await RoomHold_1.RoomHold.exists({
                        roomId: room._id,
                        status: types_1.HoldStatus.ACTIVE,
                        expirationTimestamp: { $gt: new Date() },
                        checkInDate: { $lt: checkOutDate },
                        checkOutDate: { $gt: checkInDate },
                    }).session(session);
                    if (hasHold)
                        continue;
                    // Recheck maintenance blocks
                    if (room.maintenanceInfo && room.maintenanceInfo.length > 0) {
                        const inMaintenance = room.maintenanceInfo.some((block) => availability_service_1.AvailabilityService.isDateOverlap(block.startDate, block.endDate, checkInDate, checkOutDate));
                        if (inMaintenance)
                            continue;
                    }
                    selectedRoom = room;
                    break;
                }
                if (!selectedRoom) {
                    throw new errors_1.RoomUnavailableError();
                }
                // 3. Calculate authoritative server-side pricing
                let holdVoucher = null;
                if (discountCode) {
                    const v = await Voucher_1.Voucher.findOne({
                        code: discountCode.trim().toUpperCase(),
                        isActive: true,
                    }).session(session);
                    if (v) {
                        holdVoucher = {
                            code: v.code,
                            discountType: v.discountType,
                            discountValue: v.discountValue,
                            maxDiscountAmount: v.maxDiscountAmount,
                            minBookingAmount: v.minBookingAmount,
                        };
                    }
                }
                const pricing = pricing_service_1.PricingService.calculatePricing(ratePlan, roomType, checkInDate, checkOutDate, numberOfGuests, discountCode, holdVoucher);
                // 4. Generate secure hold token and expiration
                const { rawToken, hashedToken } = this.generateSecureToken();
                const settings = await PropertySettings_1.PropertySettings.findOne().session(session);
                const holdDuration = (settings?.holdDurationMinutes || 15) * 60 * 1000;
                const expirationTimestamp = new Date(Date.now() + holdDuration);
                const hold = new RoomHold_1.RoomHold({
                    roomId: selectedRoom._id,
                    roomTypeId: roomType._id,
                    checkInDate,
                    checkOutDate,
                    secureTokenHash: hashedToken,
                    expirationTimestamp,
                    status: types_1.HoldStatus.ACTIVE,
                    idempotencyKey,
                    guestsCount: numberOfGuests,
                    calculatedPrice: pricing.totalAmount,
                });
                await hold.save({ session });
                await (0, audit_1.logAudit)({
                    action: 'ROOM_HOLD_CREATED',
                    entityType: 'RoomHold',
                    entityId: hold._id.toString(),
                    changes: { after: { roomId: selectedRoom._id, checkInDate, checkOutDate, expiresAt: expirationTimestamp } },
                });
                return {
                    hold,
                    holdToken: rawToken,
                    expiresAt: expirationTimestamp,
                    pricing,
                };
            });
        });
    }
    /**
     * Step 2: Create or confirm a booking atomically inside transaction.
     * Concurrency protected via RoomInventoryLock.
     */
    static async createBooking(input) {
        const { holdId, holdToken, roomTypeId, specificRoomId, checkInDate, checkOutDate, numberOfGuests, numberOfRooms = 1, discountCode, guest: guestInput, source = types_1.BookingSource.WEBSITE, specialRequests, idempotencyKey, createdBy, } = input;
        if (checkInDate >= checkOutDate) {
            throw new errors_1.BadRequestError('checkInDate must be strictly before checkOutDate');
        }
        // Enforce Hotel Policy on Hourly / Short-Stay bookings
        if (input.bookingType === 'HOURLY') {
            const policyCheck = policy_service_1.HotelPolicyService.validateBookingPolicy({
                bookingType: 'HOURLY',
                durationHours: input.durationHours || 2,
                numberOfRooms,
                malesCount: input.guestComposition?.males ?? 1,
                femalesCount: input.guestComposition?.females ?? 0,
            });
            if (!policyCheck.isAllowed) {
                throw new errors_1.BadRequestError(policyCheck.message);
            }
        }
        const lockKey = String(specificRoomId || roomTypeId || holdId || 'booking_lock');
        return await RoomMutex.runWithLock(lockKey, async () => {
            return await (0, database_1.withTransaction)(async (session) => {
                let allocatedRoomId;
                let effectiveRoomTypeId;
                let activeHoldDoc = null;
                // Case A: Converting from Hold
                if (holdId && holdToken) {
                    activeHoldDoc = await RoomHold_1.RoomHold.findById(holdId).session(session);
                    if (!activeHoldDoc) {
                        throw new errors_1.NotFoundError('Specified hold was not found');
                    }
                    const hashed = this.hashToken(holdToken);
                    if (activeHoldDoc.secureTokenHash !== hashed) {
                        throw new errors_1.UnauthorizedError('Invalid hold token');
                    }
                    if (activeHoldDoc.status !== types_1.HoldStatus.ACTIVE) {
                        throw new errors_1.ConflictError('This hold is no longer active');
                    }
                    if (activeHoldDoc.expirationTimestamp <= new Date()) {
                        activeHoldDoc.status = types_1.HoldStatus.EXPIRED;
                        await activeHoldDoc.save({ session });
                        throw new errors_1.ConflictError('Hold has expired. Please search again for availability');
                    }
                    allocatedRoomId = activeHoldDoc.roomId;
                    effectiveRoomTypeId = activeHoldDoc.roomTypeId;
                }
                else {
                    // Case B: Direct creation (e.g. Admin or Walk-in or Instant)
                    if (!roomTypeId && !specificRoomId) {
                        throw new errors_1.BadRequestError('Either holdId or roomTypeId/specificRoomId is required');
                    }
                    let query = { status: types_1.RoomStatus.ACTIVE };
                    if (specificRoomId) {
                        query._id = new mongoose_1.default.Types.ObjectId(specificRoomId);
                    }
                    else if (roomTypeId) {
                        query.roomTypeId = new mongoose_1.default.Types.ObjectId(roomTypeId);
                    }
                    const candidateRooms = await Room_1.Room.find(query).session(session);
                    if (candidateRooms.length === 0) {
                        throw new errors_1.RoomUnavailableError();
                    }
                    let foundRoom = null;
                    for (const room of candidateRooms) {
                        // Concurrency lock per room
                        await RoomInventoryLock_1.RoomInventoryLock.findOneAndUpdate({ roomId: room._id }, { $inc: { version: 1 }, $set: { lastLockedAt: new Date(), lockedByOperation: 'BOOKING_CREATION' } }, { session, upsert: true, new: true });
                        // Check bookings
                        const hasBooking = await Booking_1.Booking.exists({
                            assignedRoomId: room._id,
                            reservationStatus: {
                                $in: [types_1.ReservationStatus.CONFIRMED, types_1.ReservationStatus.PENDING_PAYMENT, types_1.ReservationStatus.HELD],
                            },
                            checkInDate: { $lt: checkOutDate },
                            checkOutDate: { $gt: checkInDate },
                        }).session(session);
                        if (hasBooking)
                            continue;
                        // Check unexpired holds
                        const hasHold = await RoomHold_1.RoomHold.exists({
                            roomId: room._id,
                            status: types_1.HoldStatus.ACTIVE,
                            expirationTimestamp: { $gt: new Date() },
                            checkInDate: { $lt: checkOutDate },
                            checkOutDate: { $gt: checkInDate },
                        }).session(session);
                        if (hasHold)
                            continue;
                        // Check maintenance
                        if (room.maintenanceInfo && room.maintenanceInfo.length > 0) {
                            const inMaintenance = room.maintenanceInfo.some((block) => availability_service_1.AvailabilityService.isDateOverlap(block.startDate, block.endDate, checkInDate, checkOutDate));
                            if (inMaintenance)
                                continue;
                        }
                        foundRoom = room;
                        break;
                    }
                    if (!foundRoom) {
                        throw new errors_1.RoomUnavailableError();
                    }
                    allocatedRoomId = foundRoom._id;
                    effectiveRoomTypeId = foundRoom.roomTypeId;
                }
                // Concurrency lock for allocated room
                await RoomInventoryLock_1.RoomInventoryLock.findOneAndUpdate({ roomId: allocatedRoomId }, { $inc: { version: 1 }, $set: { lastLockedAt: new Date(), lockedByOperation: 'BOOKING_CONFIRMATION' } }, { session, upsert: true, new: true });
                // Revalidate that no conflicting confirmed booking exists for this room
                const conflictingBooking = await Booking_1.Booking.exists({
                    assignedRoomId: allocatedRoomId,
                    reservationStatus: {
                        $in: [types_1.ReservationStatus.CONFIRMED, types_1.ReservationStatus.PENDING_PAYMENT, types_1.ReservationStatus.HELD],
                    },
                    checkInDate: { $lt: checkOutDate },
                    checkOutDate: { $gt: checkInDate },
                }).session(session);
                if (conflictingBooking) {
                    throw new errors_1.RoomUnavailableError();
                }
                // Revalidate that no conflicting OTHER active hold exists
                const holdConflictQuery = {
                    roomId: allocatedRoomId,
                    status: types_1.HoldStatus.ACTIVE,
                    expirationTimestamp: { $gt: new Date() },
                    checkInDate: { $lt: checkOutDate },
                    checkOutDate: { $gt: checkInDate },
                };
                if (activeHoldDoc) {
                    holdConflictQuery._id = { $ne: activeHoldDoc._id };
                }
                const conflictingHold = await RoomHold_1.RoomHold.exists(holdConflictQuery).session(session);
                if (conflictingHold) {
                    throw new errors_1.RoomUnavailableError();
                }
                // Fetch RoomType and RatePlan for Authoritative Pricing Snapshot
                const roomType = await RoomType_1.RoomType.findById(effectiveRoomTypeId).session(session);
                if (!roomType) {
                    throw new errors_1.NotFoundError('Room type not found');
                }
                const ratePlan = await RatePlan_1.RatePlan.findOne({ roomTypeId: effectiveRoomTypeId, isActive: true }).session(session);
                if (!ratePlan) {
                    throw new errors_1.BadRequestError('Active rate plan not found');
                }
                let bookingVoucher = null;
                if (discountCode) {
                    const v = await Voucher_1.Voucher.findOne({
                        code: discountCode.trim().toUpperCase(),
                        isActive: true,
                    }).session(session);
                    if (v) {
                        bookingVoucher = {
                            code: v.code,
                            discountType: v.discountType,
                            discountValue: v.discountValue,
                            maxDiscountAmount: v.maxDiscountAmount,
                            minBookingAmount: v.minBookingAmount,
                        };
                    }
                }
                const pricing = pricing_service_1.PricingService.calculatePricing(ratePlan, roomType, checkInDate, checkOutDate, numberOfGuests, discountCode, bookingVoucher);
                // Upsert Guest Record
                let guest = await Guest_1.Guest.findOne({
                    email: guestInput.email.toLowerCase().trim(),
                }).session(session);
                const bookingReference = this.generateBookingReference();
                if (!guest) {
                    guest = new Guest_1.Guest({
                        fullName: guestInput.fullName.trim(),
                        email: guestInput.email.toLowerCase().trim(),
                        mobile: guestInput.mobile.trim(),
                        nationality: guestInput.nationality || 'Indian',
                        address: guestInput.address,
                        bookingReferences: [bookingReference],
                    });
                    await guest.save({ session });
                }
                else {
                    if (!guest.bookingReferences.includes(bookingReference)) {
                        guest.bookingReferences.push(bookingReference);
                        await guest.save({ session });
                    }
                }
                // Generate Cryptographic QR Token
                const { rawToken: rawQrToken, hashedToken: hashedQrToken } = this.generateSecureToken();
                const qrExpiresAt = new Date(`${checkOutDate}T23:59:59Z`);
                // Determine initial status
                const reservationStatus = types_1.ReservationStatus.CONFIRMED;
                const paymentStatus = input.immediatePayment ? types_1.PaymentStatus.PAID : types_1.PaymentStatus.PENDING;
                // Create Booking with Immutable Historical Pricing Snapshot
                const booking = new Booking_1.Booking({
                    bookingReference,
                    guestId: guest._id,
                    assignedRoomId: allocatedRoomId,
                    roomTypeId: effectiveRoomTypeId,
                    checkInDate,
                    checkOutDate,
                    numberOfGuests,
                    numberOfRooms,
                    reservationStatus,
                    stayStatus: types_1.StayStatus.NOT_CHECKED_IN,
                    paymentStatus,
                    nightlyPriceBreakdown: pricing.perNightBreakdown,
                    subtotal: pricing.subtotal,
                    discount: pricing.discount,
                    discountCode: pricing.discountCode,
                    taxes: pricing.taxes,
                    taxRatePercentage: pricing.taxRatePercentage,
                    extraCharges: pricing.additionalCharges,
                    totalAmount: pricing.totalAmount,
                    currency: pricing.currency,
                    source,
                    specialRequests,
                    qrTokenHash: hashedQrToken,
                    qrTokenExpiresAt: qrExpiresAt,
                    holdId: activeHoldDoc?._id,
                    idempotencyKey,
                    createdBy: createdBy ? new mongoose_1.default.Types.ObjectId(createdBy) : undefined,
                });
                await booking.save({ session });
                // Mark Hold as converted
                if (activeHoldDoc) {
                    activeHoldDoc.status = types_1.HoldStatus.CONVERTED_TO_BOOKING;
                    activeHoldDoc.convertedBookingId = booking._id;
                    await activeHoldDoc.save({ session });
                }
                // Create initial GuestRegistration record
                await GuestRegistration_1.GuestRegistration.create([
                    {
                        bookingId: booking._id,
                        guestId: guest._id,
                        registrationDetails: {
                            primaryGuest: {
                                fullName: guest.fullName,
                                phone: guest.mobile,
                                email: guest.email,
                                nationality: guest.nationality || 'Indian',
                                idProofType: guest.idProofType || 'Aadhaar',
                                idProofNumberMasked: guest.idProofNumberMasked || 'XXXX-XXXX-XXXX',
                            },
                            additionalGuests: [],
                        },
                        verificationStatus: types_1.RegistrationStatus.PENDING,
                        consentRecords: [
                            {
                                consentType: 'DIGITAL_CHECKIN_CONSENT',
                                granted: true,
                                timestamp: new Date(),
                            },
                        ],
                    },
                ], { session });
                await (0, audit_1.logAudit)({
                    action: 'BOOKING_CONFIRMED',
                    entityType: 'Booking',
                    entityId: booking._id.toString(),
                    userId: createdBy,
                    changes: {
                        after: {
                            bookingReference,
                            room: allocatedRoomId,
                            dates: `${checkInDate} to ${checkOutDate}`,
                            totalAmount: pricing.totalAmount,
                        },
                    },
                });
                // Increment voucher redemptions if applied
                if (pricing.discountCode) {
                    await voucher_service_1.VoucherService.incrementUsage(pricing.discountCode);
                }
                // Real-time notification to front desk / admin
                try {
                    (0, socket_1.emitToAdmin)('booking:new', {
                        bookingReference,
                        guestName: guest.fullName,
                        dates: `${checkInDate} to ${checkOutDate}`,
                        totalAmount: pricing.totalAmount,
                        createdAt: new Date(),
                    });
                }
                catch (err) {
                    // Non-blocking socket emission
                }
                return {
                    booking,
                    qrToken: rawQrToken,
                    pricing,
                };
            });
        });
    }
    /**
     * Cancel booking enforcing cancellation rules and auditing.
     */
    static async cancelBooking(referenceOrId, reason, cancelledByUserId, isAdmin = false) {
        return await (0, database_1.withTransaction)(async (session) => {
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(referenceOrId);
            const query = isObjectId
                ? { $or: [{ _id: referenceOrId }, { bookingReference: referenceOrId }] }
                : { bookingReference: referenceOrId };
            const booking = await Booking_1.Booking.findOne(query).session(session);
            if (!booking) {
                throw new errors_1.NotFoundError('Booking not found');
            }
            if (booking.reservationStatus === types_1.ReservationStatus.CANCELLED) {
                throw new errors_1.BadRequestError('Booking is already cancelled');
            }
            if (booking.stayStatus === types_1.StayStatus.CHECKED_IN || booking.stayStatus === types_1.StayStatus.CHECKED_OUT) {
                throw new errors_1.BadRequestError('Cannot cancel a stay that is already checked in or checked out');
            }
            // Validate cancellation timing unless admin override
            if (!isAdmin) {
                const settings = await PropertySettings_1.PropertySettings.findOne().session(session);
                const graceHours = settings?.cancellationGraceHours || 24;
                const checkInTime = new Date(`${booking.checkInDate}T14:00:00Z`).getTime();
                const now = Date.now();
                const diffHours = (checkInTime - now) / (1000 * 60 * 60);
                if (diffHours < graceHours) {
                    throw new errors_1.BadRequestError(`Free online cancellation is only allowed up to ${graceHours} hours before check-in. Please contact the front desk at +91 8110018708.`);
                }
            }
            const beforeStatus = booking.reservationStatus;
            booking.reservationStatus = types_1.ReservationStatus.CANCELLED;
            booking.cancelledAt = new Date();
            booking.cancellationReason = reason;
            if (cancelledByUserId && mongoose_1.default.Types.ObjectId.isValid(cancelledByUserId)) {
                booking.cancelledBy = new mongoose_1.default.Types.ObjectId(cancelledByUserId);
            }
            await booking.save({ session });
            // Unlock room inventory control document
            await RoomInventoryLock_1.RoomInventoryLock.findOneAndUpdate({ roomId: booking.assignedRoomId }, { $inc: { version: 1 }, $set: { lastLockedAt: new Date(), lockedByOperation: 'BOOKING_CANCELLED' } }, { session });
            await (0, audit_1.logAudit)({
                action: 'BOOKING_CANCELLED',
                entityType: 'Booking',
                entityId: booking._id.toString(),
                userId: cancelledByUserId,
                changes: {
                    before: { status: beforeStatus },
                    after: { status: types_1.ReservationStatus.CANCELLED, reason },
                },
            });
            return booking;
        });
    }
    /**
     * Lookup booking by reference with guest verification to prevent unauthorized data access.
     */
    static async getBookingByReference(reference, guestVerification, isStaff = false) {
        const booking = await Booking_1.Booking.findOne({ bookingReference: reference.toUpperCase().trim() })
            .populate('guestId', 'fullName email mobile nationality')
            .populate('assignedRoomId', 'roomNumber floor status housekeepingStatus')
            .populate('roomTypeId', 'name code category bedConfiguration images amenities');
        if (!booking) {
            throw new errors_1.NotFoundError('Booking reference not found');
        }
        if (!isStaff) {
            if (!guestVerification?.email && !guestVerification?.mobile) {
                throw new errors_1.UnauthorizedError('Email or mobile verification is required to view booking details', 'VERIFICATION_REQUIRED');
            }
            const guest = booking.guestId;
            const emailMatches = guestVerification.email &&
                guest?.email?.toLowerCase().trim() === guestVerification.email.toLowerCase().trim();
            const mobileMatches = guestVerification.mobile &&
                guest?.mobile?.replace(/\D/g, '') === guestVerification.mobile.replace(/\D/g, '');
            if (!emailMatches && !mobileMatches) {
                throw new errors_1.UnauthorizedError('Verification failed: Email or mobile does not match this reservation', 'VERIFICATION_FAILED');
            }
        }
        return booking;
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=booking.service.js.map