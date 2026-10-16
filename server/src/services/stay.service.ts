import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { StayRecord, IStayRecord } from '../models/StayRecord';
import { GuestRegistration } from '../models/GuestRegistration';
import { withTransaction } from '../config/database';
import {
  ReservationStatus,
  StayStatus,
  PaymentStatus,
  HousekeepingStatus,
  RegistrationStatus,
} from '../types';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import { logAudit } from '../utils/audit';
import { HotelPolicyService } from './policy.service';

export interface CheckInInput {
  bookingId: string;
  staffUserId: string;
  roomId?: string; // allow staff to reassign room during check-in
  bypassRegistrationCheck?: boolean;
  notes?: string;
}

export interface CheckOutInput {
  stayId: string;
  staffUserId: string;
  additionalCharges?: Array<{
    description: string;
    amount: number;
    category: 'MINI_BAR' | 'ROOM_SERVICE' | 'LAUNDRY' | 'DAMAGE' | 'OVERSTAY' | 'OTHER';
  }>;
  autoCalculateOverstay?: boolean;
  finalPaidAmount?: number;
  notes?: string;
}

export class StayService {
  /**
   * Complete digital / front-desk check-in
   */
  public static async checkIn(input: CheckInInput): Promise<{
    stay: IStayRecord;
    booking: any;
  }> {
    const { bookingId, staffUserId, roomId, bypassRegistrationCheck = false, notes } = input;

    return await withTransaction(async (session) => {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.reservationStatus !== ReservationStatus.CONFIRMED) {
        throw new BadRequestError(`Cannot check in. Booking status is ${booking.reservationStatus}`);
      }

      if (booking.stayStatus === StayStatus.CHECKED_IN) {
        throw new ConflictError('Guest is already checked in for this booking');
      }

      if (booking.stayStatus === StayStatus.CHECKED_OUT) {
        throw new BadRequestError('Booking has already completed check-out');
      }

      // Check registration verification status unless staff bypassed with audit
      if (!bypassRegistrationCheck) {
        const registration = await GuestRegistration.findOne({ bookingId: booking._id }).session(session);
        if (registration && registration.verificationStatus === RegistrationStatus.REJECTED) {
          throw new BadRequestError('Guest registration was rejected. Identity verification required.');
        }
      }

      // Target Room
      const effectiveRoomId = roomId ? new mongoose.Types.ObjectId(roomId) : booking.assignedRoomId;
      const room = await Room.findById(effectiveRoomId).session(session);
      if (!room) {
        throw new NotFoundError('Assigned room not found');
      }

      // If staff reallocated room during check-in, update booking
      if (roomId && !booking.assignedRoomId.equals(effectiveRoomId)) {
        booking.assignedRoomId = effectiveRoomId;
      }

      // Update room housekeeping and operational status
      room.housekeepingStatus = HousekeepingStatus.CLEAN;
      await room.save({ session });

      // Update booking stay status
      booking.stayStatus = StayStatus.CHECKED_IN;
      await booking.save({ session });

      // Create or update StayRecord
      let stay = await StayRecord.findOne({ bookingId: booking._id }).session(session);
      if (!stay) {
        stay = new StayRecord({
          bookingId: booking._id,
          roomId: effectiveRoomId,
          actualCheckInTimestamp: new Date(),
          checkedInBy: new mongoose.Types.ObjectId(staffUserId),
          stayStatus: 'ACTIVE',
          notes,
        });
      } else {
        stay.actualCheckInTimestamp = new Date();
        stay.checkedInBy = new mongoose.Types.ObjectId(staffUserId);
        stay.stayStatus = 'ACTIVE';
        if (notes) stay.notes = notes;
      }

      await stay.save({ session });

      await logAudit({
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
  public static async checkOut(input: CheckOutInput): Promise<{
    stay: IStayRecord;
    booking: any;
  }> {
    const { stayId, staffUserId, additionalCharges = [], autoCalculateOverstay = true, finalPaidAmount, notes } = input;

    return await withTransaction(async (session) => {
      const stay = await StayRecord.findById(stayId).session(session);
      if (!stay) {
        throw new NotFoundError('Stay record not found');
      }

      if (stay.stayStatus === 'COMPLETED') {
        throw new ConflictError('Check-out has already been completed for this stay');
      }

      const booking = await Booking.findById(stay.bookingId).session(session);
      if (!booking) {
        throw new NotFoundError('Associated booking not found');
      }

      const room = await Room.findById(stay.roomId).session(session);
      if (!room) {
        throw new NotFoundError('Associated room not found');
      }

      // Automatically calculate overstay / late check-out fee if past 11:00 AM on check-out date
      if (autoCalculateOverstay) {
        const dailyRate =
          booking.nightlyPriceBreakdown?.[0]?.totalNightRate ||
          Math.round(booking.subtotal / Math.max(1, booking.numberOfGuests)) ||
          250000;
        const overstay = HotelPolicyService.calculateOverstay(
          booking.checkOutDate,
          dailyRate,
          new Date()
        );
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
          addedBy: new mongoose.Types.ObjectId(staffUserId),
          addedAt: new Date(),
        });
        booking.extraCharges += chg.amount;
        booking.totalAmount += chg.amount;
      }

      // Final bill reference
      const billRef = `BILL-${booking.bookingReference}`;
      stay.actualCheckOutTimestamp = new Date();
      stay.checkedOutBy = new mongoose.Types.ObjectId(staffUserId);
      stay.stayStatus = 'COMPLETED';
      stay.finalBillReference = billRef;
      if (finalPaidAmount !== undefined) {
        stay.finalPaidAmount = finalPaidAmount;
      }
      if (notes) stay.notes = notes;
      await stay.save({ session });

      // Update Booking
      booking.stayStatus = StayStatus.CHECKED_OUT;
      booking.paymentStatus = PaymentStatus.PAID;
      await booking.save({ session });

      // Set Room housekeeping status to DIRTY (needs cleaning before next guest)
      room.housekeepingStatus = HousekeepingStatus.DIRTY;
      await room.save({ session });

      await logAudit({
        action: 'STAY_CHECKED_OUT',
        entityType: 'StayRecord',
        entityId: stay._id.toString(),
        userId: staffUserId,
        changes: {
          after: {
            bookingReference: booking.bookingReference,
            roomNumber: room.roomNumber,
            actualCheckOutTimestamp: stay.actualCheckOutTimestamp,
            housekeepingStatus: HousekeepingStatus.DIRTY,
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
  public static async getOverstayPreview(stayId: string): Promise<any> {
    const stay = await StayRecord.findById(stayId);
    if (!stay) {
      throw new NotFoundError('Stay record not found');
    }
    const booking = await Booking.findById(stay.bookingId);
    if (!booking) {
      throw new NotFoundError('Associated booking not found');
    }
    const dailyRate =
      booking.nightlyPriceBreakdown?.[0]?.totalNightRate ||
      Math.round(booking.subtotal / Math.max(1, booking.numberOfGuests)) ||
      250000;
    return HotelPolicyService.calculateOverstay(booking.checkOutDate, dailyRate, new Date());
  }
}

