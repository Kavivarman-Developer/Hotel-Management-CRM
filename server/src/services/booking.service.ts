import crypto from 'crypto';
import mongoose from 'mongoose';
import { Booking, IBooking } from '../models/Booking';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { RatePlan } from '../models/RatePlan';
import { RoomHold, IRoomHold } from '../models/RoomHold';
import { RoomInventoryLock } from '../models/RoomInventoryLock';
import { Guest } from '../models/Guest';
import { GuestRegistration } from '../models/GuestRegistration';
import { PropertySettings } from '../models/PropertySettings';
import { Voucher } from '../models/Voucher';
import { VoucherService } from './voucher.service';
import { emitToAdmin } from '../socket';
import { PricingService } from './pricing.service';
import { AvailabilityService } from './availability.service';
import { HotelPolicyService } from './policy.service';
import { withTransaction } from '../config/database';
import {
  BookingSource,
  HoldStatus,
  ReservationStatus,
  StayStatus,
  PaymentStatus,
  RoomStatus,
  RegistrationStatus,
} from '../types';
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  RoomUnavailableError,
  UnauthorizedError,
} from '../utils/errors';
import { logAudit } from '../utils/audit';

export interface CreateHoldInput {
  roomTypeId: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfGuests: number;
  discountCode?: string;
  idempotencyKey?: string;
  specificRoomId?: string;
}

export interface CreateBookingInput {
  holdId?: string;
  holdToken?: string;
  roomTypeId?: string;
  specificRoomId?: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfGuests: number;
  numberOfRooms?: number;
  discountCode?: string;
  bookingType?: 'DAILY' | 'HOURLY';
  durationHours?: number;
  guestComposition?: {
    males: number;
    females: number;
  };
  guest: {
    fullName: string;
    email: string;
    mobile: string;
    nationality?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  };
  source?: BookingSource;
  specialRequests?: string;
  idempotencyKey?: string;
  createdBy?: string;
  immediatePayment?: {
    provider: 'DEVELOPMENT_ADAPTER' | 'RAZORPAY' | 'STRIPE' | 'CASH' | 'UPI';
    transactionReference?: string;
  };
}

class RoomMutex {
  private static locks = new Map<string, Promise<void>>();

  public static async runWithLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.locks.set(key, lockPromise);

    try {
      return await fn();
    } finally {
      this.locks.delete(key);
      resolveLock();
    }
  }
}

export class BookingService {
  /**
   * Generates a human-friendly unique booking reference: GOR-YYYYMMDD-XXXX
   */
  public static generateBookingReference(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `GOR-${y}${m}${d}-${randomHex}`;
  }

  /**
   * Generates a cryptographically secure token and its SHA-256 hash.
   */
  public static generateSecureToken(): { rawToken: string; hashedToken: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, hashedToken };
  }

  /**
   * Hashes a raw token for lookup.
   */
  public static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Step 1: Create a temporary room hold with full concurrency control.
   */
  public static async createHold(input: CreateHoldInput): Promise<{
    hold: IRoomHold;
    holdToken: string;
    expiresAt: Date;
    pricing: any;
  }> {
    const { roomTypeId, checkInDate, checkOutDate, numberOfGuests, discountCode, specificRoomId, idempotencyKey } =
      input;

    if (checkInDate >= checkOutDate) {
      throw new BadRequestError('checkInDate must be strictly before checkOutDate');
    }

    const lockKey = String(specificRoomId || roomTypeId);
    return await RoomMutex.runWithLock(lockKey, async () => {
      return await withTransaction(async (session) => {
      // 1. Validate Room Type and Rate Plan
      const roomType = await RoomType.findById(roomTypeId).session(session);
      if (!roomType || !roomType.isActive) {
        throw new NotFoundError('Selected room type not found or inactive');
      }

      if (roomType.maxOccupancy.total < numberOfGuests) {
        throw new BadRequestError(`Room capacity (${roomType.maxOccupancy.total}) is less than guests (${numberOfGuests})`);
      }

      const ratePlan = await RatePlan.findOne({ roomTypeId: roomType._id, isActive: true }).session(session);
      if (!ratePlan) {
        throw new BadRequestError('No active rate plan found for this room type');
      }

      // 2. Fetch candidate physical rooms
      const query: any = {
        roomTypeId: roomType._id,
        status: RoomStatus.ACTIVE,
      };
      if (specificRoomId) {
        query._id = new mongoose.Types.ObjectId(specificRoomId);
      }

      const candidateRooms = await Room.find(query).session(session);
      if (candidateRooms.length === 0) {
        throw new RoomUnavailableError();
      }

      // Find an available room that is free from overlapping bookings, unexpired holds, and maintenance
      let selectedRoom: any = null;

      for (const room of candidateRooms) {
        // Shared inventory-control write
        await RoomInventoryLock.findOneAndUpdate(
          { roomId: room._id },
          { $inc: { version: 1 }, $set: { lastLockedAt: new Date(), lockedByOperation: 'HOLD_CREATION' } },
          { session, upsert: true, new: true }
        );

        // Recheck overlapping bookings
        const hasBooking = await Booking.exists({
          assignedRoomId: room._id,
          reservationStatus: {
            $in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING_PAYMENT, ReservationStatus.HELD],
          },
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate },
        }).session(session);

        if (hasBooking) continue;

        // Recheck active unexpired holds
        const hasHold = await RoomHold.exists({
          roomId: room._id,
          status: HoldStatus.ACTIVE,
          expirationTimestamp: { $gt: new Date() },
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate },
        }).session(session);

        if (hasHold) continue;

        // Recheck maintenance blocks
        if (room.maintenanceInfo && room.maintenanceInfo.length > 0) {
          const inMaintenance = room.maintenanceInfo.some((block: any) =>
            AvailabilityService.isDateOverlap(block.startDate, block.endDate, checkInDate, checkOutDate)
          );
          if (inMaintenance) continue;
        }

        selectedRoom = room;
        break;
      }

      if (!selectedRoom) {
        throw new RoomUnavailableError();
      }

      // 3. Calculate authoritative server-side pricing
      let holdVoucher: any = null;
      if (discountCode) {
        const v = await Voucher.findOne({
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

      const pricing = PricingService.calculatePricing(
        ratePlan,
        roomType,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        discountCode,
        holdVoucher
      );

      // 4. Generate secure hold token and expiration
      const { rawToken, hashedToken } = this.generateSecureToken();
      const settings = await PropertySettings.findOne().session(session);
      const holdDuration = (settings?.holdDurationMinutes || 15) * 60 * 1000;
      const expirationTimestamp = new Date(Date.now() + holdDuration);

      const hold = new RoomHold({
        roomId: selectedRoom._id,
        roomTypeId: roomType._id,
        checkInDate,
        checkOutDate,
        secureTokenHash: hashedToken,
        expirationTimestamp,
        status: HoldStatus.ACTIVE,
        idempotencyKey,
        guestsCount: numberOfGuests,
        calculatedPrice: pricing.totalAmount,
      });

      await hold.save({ session });

      await logAudit({
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
  public static async createBooking(input: CreateBookingInput): Promise<{
    booking: IBooking;
    qrToken: string;
    pricing: any;
  }> {
    const {
      holdId,
      holdToken,
      roomTypeId,
      specificRoomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      numberOfRooms = 1,
      discountCode,
      guest: guestInput,
      source = BookingSource.WEBSITE,
      specialRequests,
      idempotencyKey,
      createdBy,
    } = input;

    if (checkInDate >= checkOutDate) {
      throw new BadRequestError('checkInDate must be strictly before checkOutDate');
    }

    // Enforce Hotel Policy on Hourly / Short-Stay bookings
    if (input.bookingType === 'HOURLY') {
      const policyCheck = HotelPolicyService.validateBookingPolicy({
        bookingType: 'HOURLY',
        durationHours: input.durationHours || 2,
        numberOfRooms,
        malesCount: input.guestComposition?.males ?? 1,
        femalesCount: input.guestComposition?.females ?? 0,
      });
      if (!policyCheck.isAllowed) {
        throw new BadRequestError(policyCheck.message);
      }
    }

    const lockKey = String(specificRoomId || roomTypeId || holdId || 'booking_lock');
    return await RoomMutex.runWithLock(lockKey, async () => {
      return await withTransaction(async (session) => {
      let allocatedRoomId: mongoose.Types.ObjectId;
      let effectiveRoomTypeId: mongoose.Types.ObjectId;
      let activeHoldDoc: IRoomHold | null = null;

      // Case A: Converting from Hold
      if (holdId && holdToken) {
        activeHoldDoc = await RoomHold.findById(holdId).session(session);
        if (!activeHoldDoc) {
          throw new NotFoundError('Specified hold was not found');
        }

        const hashed = this.hashToken(holdToken);
        if (activeHoldDoc.secureTokenHash !== hashed) {
          throw new UnauthorizedError('Invalid hold token');
        }

        if (activeHoldDoc.status !== HoldStatus.ACTIVE) {
          throw new ConflictError('This hold is no longer active');
        }

        if (activeHoldDoc.expirationTimestamp <= new Date()) {
          activeHoldDoc.status = HoldStatus.EXPIRED;
          await activeHoldDoc.save({ session });
          throw new ConflictError('Hold has expired. Please search again for availability');
        }

        allocatedRoomId = activeHoldDoc.roomId;
        effectiveRoomTypeId = activeHoldDoc.roomTypeId;
      } else {
        // Case B: Direct creation (e.g. Admin or Walk-in or Instant)
        if (!roomTypeId && !specificRoomId) {
          throw new BadRequestError('Either holdId or roomTypeId/specificRoomId is required');
        }

        let query: any = { status: RoomStatus.ACTIVE };
        if (specificRoomId) {
          query._id = new mongoose.Types.ObjectId(specificRoomId);
        } else if (roomTypeId) {
          query.roomTypeId = new mongoose.Types.ObjectId(roomTypeId);
        }

        const candidateRooms = await Room.find(query).session(session);
        if (candidateRooms.length === 0) {
          throw new RoomUnavailableError();
        }

        let foundRoom: any = null;
        for (const room of candidateRooms) {
          // Concurrency lock per room
          await RoomInventoryLock.findOneAndUpdate(
            { roomId: room._id },
            { $inc: { version: 1 }, $set: { lastLockedAt: new Date(), lockedByOperation: 'BOOKING_CREATION' } },
            { session, upsert: true, new: true }
          );

          // Check bookings
          const hasBooking = await Booking.exists({
            assignedRoomId: room._id,
            reservationStatus: {
              $in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING_PAYMENT, ReservationStatus.HELD],
            },
            checkInDate: { $lt: checkOutDate },
            checkOutDate: { $gt: checkInDate },
          }).session(session);

          if (hasBooking) continue;

          // Check unexpired holds
          const hasHold = await RoomHold.exists({
            roomId: room._id,
            status: HoldStatus.ACTIVE,
            expirationTimestamp: { $gt: new Date() },
            checkInDate: { $lt: checkOutDate },
            checkOutDate: { $gt: checkInDate },
          }).session(session);

          if (hasHold) continue;

          // Check maintenance
          if (room.maintenanceInfo && room.maintenanceInfo.length > 0) {
            const inMaintenance = room.maintenanceInfo.some((block: any) =>
              AvailabilityService.isDateOverlap(block.startDate, block.endDate, checkInDate, checkOutDate)
            );
            if (inMaintenance) continue;
          }

          foundRoom = room;
          break;
        }

        if (!foundRoom) {
          throw new RoomUnavailableError();
        }

        allocatedRoomId = foundRoom._id;
        effectiveRoomTypeId = foundRoom.roomTypeId;
      }

      // Concurrency lock for allocated room
      await RoomInventoryLock.findOneAndUpdate(
        { roomId: allocatedRoomId },
        { $inc: { version: 1 }, $set: { lastLockedAt: new Date(), lockedByOperation: 'BOOKING_CONFIRMATION' } },
        { session, upsert: true, new: true }
      );

      // Revalidate that no conflicting confirmed booking exists for this room
      const conflictingBooking = await Booking.exists({
        assignedRoomId: allocatedRoomId,
        reservationStatus: {
          $in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING_PAYMENT, ReservationStatus.HELD],
        },
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate },
      }).session(session);

      if (conflictingBooking) {
        throw new RoomUnavailableError();
      }

      // Revalidate that no conflicting OTHER active hold exists
      const holdConflictQuery: any = {
        roomId: allocatedRoomId,
        status: HoldStatus.ACTIVE,
        expirationTimestamp: { $gt: new Date() },
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate },
      };
      if (activeHoldDoc) {
        holdConflictQuery._id = { $ne: activeHoldDoc._id };
      }

      const conflictingHold = await RoomHold.exists(holdConflictQuery).session(session);
      if (conflictingHold) {
        throw new RoomUnavailableError();
      }

      // Fetch RoomType and RatePlan for Authoritative Pricing Snapshot
      const roomType = await RoomType.findById(effectiveRoomTypeId).session(session);
      if (!roomType) {
        throw new NotFoundError('Room type not found');
      }

      const ratePlan = await RatePlan.findOne({ roomTypeId: effectiveRoomTypeId, isActive: true }).session(session);
      if (!ratePlan) {
        throw new BadRequestError('Active rate plan not found');
      }

      let bookingVoucher: any = null;
      if (discountCode) {
        const v = await Voucher.findOne({
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

      const pricing = PricingService.calculatePricing(
        ratePlan,
        roomType,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        discountCode,
        bookingVoucher
      );

      // Upsert Guest Record
      let guest = await Guest.findOne({
        email: guestInput.email.toLowerCase().trim(),
      }).session(session);

      const bookingReference = this.generateBookingReference();

      if (!guest) {
        guest = new Guest({
          fullName: guestInput.fullName.trim(),
          email: guestInput.email.toLowerCase().trim(),
          mobile: guestInput.mobile.trim(),
          nationality: guestInput.nationality || 'Indian',
          address: guestInput.address,
          bookingReferences: [bookingReference],
        });
        await guest.save({ session });
      } else {
        if (!guest.bookingReferences.includes(bookingReference)) {
          guest.bookingReferences.push(bookingReference);
          await guest.save({ session });
        }
      }

      // Generate Cryptographic QR Token
      const { rawToken: rawQrToken, hashedToken: hashedQrToken } = this.generateSecureToken();
      const qrExpiresAt = new Date(`${checkOutDate}T23:59:59Z`);

      // Determine initial status
      const reservationStatus = ReservationStatus.CONFIRMED;
      const paymentStatus = input.immediatePayment ? PaymentStatus.PAID : PaymentStatus.PENDING;

      // Create Booking with Immutable Historical Pricing Snapshot
      const booking = new Booking({
        bookingReference,
        guestId: guest._id,
        assignedRoomId: allocatedRoomId,
        roomTypeId: effectiveRoomTypeId,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        numberOfRooms,
        reservationStatus,
        stayStatus: StayStatus.NOT_CHECKED_IN,
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
        createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
      });

      await booking.save({ session });

      // Mark Hold as converted
      if (activeHoldDoc) {
        activeHoldDoc.status = HoldStatus.CONVERTED_TO_BOOKING;
        activeHoldDoc.convertedBookingId = booking._id;
        await activeHoldDoc.save({ session });
      }

      // Create initial GuestRegistration record
      await GuestRegistration.create(
        [
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
            verificationStatus: RegistrationStatus.PENDING,
            consentRecords: [
              {
                consentType: 'DIGITAL_CHECKIN_CONSENT',
                granted: true,
                timestamp: new Date(),
              },
            ],
          },
        ],
        { session }
      );

      await logAudit({
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
        await VoucherService.incrementUsage(pricing.discountCode);
      }

      // Real-time notification to front desk / admin
      try {
        emitToAdmin('booking:new', {
          bookingReference,
          guestName: guest.fullName,
          dates: `${checkInDate} to ${checkOutDate}`,
          totalAmount: pricing.totalAmount,
          createdAt: new Date(),
        });
      } catch (err) {
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
  public static async cancelBooking(
    referenceOrId: string,
    reason: string,
    cancelledByUserId?: string,
    isAdmin: boolean = false
  ): Promise<IBooking> {
    return await withTransaction(async (session) => {
      const isObjectId = mongoose.Types.ObjectId.isValid(referenceOrId);
      const query = isObjectId
        ? { $or: [{ _id: referenceOrId }, { bookingReference: referenceOrId }] }
        : { bookingReference: referenceOrId };

      const booking = await Booking.findOne(query).session(session);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.reservationStatus === ReservationStatus.CANCELLED) {
        throw new BadRequestError('Booking is already cancelled');
      }

      if (booking.stayStatus === StayStatus.CHECKED_IN || booking.stayStatus === StayStatus.CHECKED_OUT) {
        throw new BadRequestError('Cannot cancel a stay that is already checked in or checked out');
      }

      // Validate cancellation timing unless admin override
      if (!isAdmin) {
        const settings = await PropertySettings.findOne().session(session);
        const graceHours = settings?.cancellationGraceHours || 24;
        const checkInTime = new Date(`${booking.checkInDate}T14:00:00Z`).getTime();
        const now = Date.now();
        const diffHours = (checkInTime - now) / (1000 * 60 * 60);

        if (diffHours < graceHours) {
          throw new BadRequestError(
            `Free online cancellation is only allowed up to ${graceHours} hours before check-in. Please contact the front desk at +91 8110018708.`
          );
        }
      }

      const beforeStatus = booking.reservationStatus;
      booking.reservationStatus = ReservationStatus.CANCELLED;
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason;
      if (cancelledByUserId && mongoose.Types.ObjectId.isValid(cancelledByUserId)) {
        booking.cancelledBy = new mongoose.Types.ObjectId(cancelledByUserId);
      }

      await booking.save({ session });

      // Unlock room inventory control document
      await RoomInventoryLock.findOneAndUpdate(
        { roomId: booking.assignedRoomId },
        { $inc: { version: 1 }, $set: { lastLockedAt: new Date(), lockedByOperation: 'BOOKING_CANCELLED' } },
        { session }
      );

      await logAudit({
        action: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: booking._id.toString(),
        userId: cancelledByUserId,
        changes: {
          before: { status: beforeStatus },
          after: { status: ReservationStatus.CANCELLED, reason },
        },
      });

      return booking;
    });
  }

  /**
   * Lookup booking by reference with guest verification to prevent unauthorized data access.
   */
  public static async getBookingByReference(
    reference: string,
    guestVerification?: { email?: string; mobile?: string },
    isStaff: boolean = false
  ): Promise<any> {
    const booking = await Booking.findOne({ bookingReference: reference.toUpperCase().trim() })
      .populate('guestId', 'fullName email mobile nationality')
      .populate('assignedRoomId', 'roomNumber floor status housekeepingStatus')
      .populate('roomTypeId', 'name code category bedConfiguration images amenities');

    if (!booking) {
      throw new NotFoundError('Booking reference not found');
    }

    if (!isStaff) {
      if (!guestVerification?.email && !guestVerification?.mobile) {
        throw new UnauthorizedError(
          'Email or mobile verification is required to view booking details',
          'VERIFICATION_REQUIRED'
        );
      }

      const guest = booking.guestId as any;
      const emailMatches =
        guestVerification.email &&
        guest?.email?.toLowerCase().trim() === guestVerification.email.toLowerCase().trim();
      const mobileMatches =
        guestVerification.mobile &&
        guest?.mobile?.replace(/\D/g, '') === guestVerification.mobile.replace(/\D/g, '');

      if (!emailMatches && !mobileMatches) {
        throw new UnauthorizedError(
          'Verification failed: Email or mobile does not match this reservation',
          'VERIFICATION_FAILED'
        );
      }
    }

    return booking;
  }
}
