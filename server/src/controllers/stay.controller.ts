import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { StayService } from '../services/stay.service';
import { StayRecord } from '../models/StayRecord';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { ReservationStatus, StayStatus } from '../types';
import { emitToAdmin } from '../socket';

export class StayController {
  /**
   * List expected arrivals (confirmed bookings pending check-in)
   */
  public static async listArrivals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const arrivals = await Booking.find({
        reservationStatus: ReservationStatus.CONFIRMED,
        stayStatus: StayStatus.NOT_CHECKED_IN,
      })
        .populate('guestId', 'fullName email mobile nationality')
        .populate('assignedRoomId', 'roomNumber floor housekeepingStatus isOccupied')
        .populate('roomTypeId', 'name code baseRate')
        .sort({ checkInDate: 1, createdAt: -1 });

      sendSuccess(res, arrivals, 'Expected arrivals retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete check-in for a booking or existing stay record
   */
  public static async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string; // bookingId or stayId
      const { roomId, bypassRegistrationCheck, notes } = req.body;

      // Determine if id is bookingId or stayId
      let bookingId = id;
      if (mongoose.Types.ObjectId.isValid(id)) {
        const stay = await StayRecord.findById(id);
        if (stay) {
          bookingId = stay.bookingId.toString();
        }
      }

      const result = await StayService.checkIn({
        bookingId,
        staffUserId: req.user!.id,
        roomId,
        bypassRegistrationCheck,
        notes,
      });

      // Real-time notification to PMS
      try {
        const room = await Room.findById(result.booking.assignedRoomId);
        emitToAdmin('stay:checked_in', {
          stayId: result.stay._id,
          bookingReference: result.booking.bookingReference,
          roomNumber: room?.roomNumber,
          guestName: (result.booking as any)?.guestId?.fullName || 'Guest',
          checkInTimestamp: result.stay.actualCheckInTimestamp,
        });

        emitToAdmin('notification:new', {
          id: `notif_${Date.now()}`,
          type: 'CHECK_IN',
          title: `Guest Checked In — Room ${room?.roomNumber || ''}`,
          message: `Booking ${result.booking.bookingReference} checked into Room ${room?.roomNumber || 'Assigned'}. Key issued.`,
          timestamp: new Date(),
          link: '/admin/stays',
        });
      } catch (err: any) {
        console.warn('Socket notification error:', err.message);
      }

      sendSuccess(res, result, 'Guest checked in successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete check-out, record charges, release room
   */
  public static async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string; // stayId
      const {
        additionalCharges = [],
        minibarCharges = 0,
        damageCharges = 0,
        lateCheckoutFee = 0,
        autoCalculateOverstay = true,
        finalPaidAmount,
        notes,
      } = req.body;

      // Format charges into structure expected by StayService
      const formattedCharges: Array<{
        description: string;
        amount: number;
        category: 'MINI_BAR' | 'ROOM_SERVICE' | 'LAUNDRY' | 'DAMAGE' | 'OVERSTAY' | 'OTHER';
      }> = [...(Array.isArray(additionalCharges) ? additionalCharges : [])];

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

      const result = await StayService.checkOut({
        stayId: id,
        staffUserId: req.user!.id,
        additionalCharges: formattedCharges,
        autoCalculateOverstay,
        finalPaidAmount,
        notes,
      });

      // Real-time broadcast
      try {
        const room = await Room.findById(result.booking.assignedRoomId);
        emitToAdmin('stay:checked_out', {
          stayId: result.stay._id,
          bookingReference: result.booking.bookingReference,
          roomNumber: room?.roomNumber,
          checkOutTimestamp: result.stay.actualCheckOutTimestamp,
          finalBillReference: result.stay.finalBillReference,
        });

        emitToAdmin('notification:new', {
          id: `notif_${Date.now()}`,
          type: 'CHECK_OUT',
          title: `Guest Departed — Room ${room?.roomNumber || ''}`,
          message: `Booking ${result.booking.bookingReference} checked out. Room ${room?.roomNumber || ''} marked DIRTY for housekeeping.`,
          timestamp: new Date(),
          link: '/admin/stays',
        });
      } catch (err: any) {
        console.warn('Socket notification error:', err.message);
      }

      sendSuccess(res, result, 'Guest checked out successfully and room flagged for housekeeping', 200);
    } catch (error) {
      next(error);
    }
  }

  public static async getOverstayPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await StayService.getOverstayPreview(id);
      sendSuccess(res, result, 'Overstay calculation retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List stays with status translation and deep population
   */
  public static async listStays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.status) {
        const s = String(req.query.status).toUpperCase();
        if (s === 'CHECKED_IN' || s === 'ACTIVE') {
          filter.stayStatus = 'ACTIVE';
        } else if (s === 'CHECKED_OUT' || s === 'COMPLETED') {
          filter.stayStatus = 'COMPLETED';
        } else if (s !== 'ALL') {
          filter.stayStatus = req.query.status;
        }
      }

      const [total, stays, inHouseCount, departedCount, arrivalsCount] = await Promise.all([
        StayRecord.countDocuments(filter),
        StayRecord.find(filter)
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
        StayRecord.countDocuments({ stayStatus: 'ACTIVE' }),
        StayRecord.countDocuments({ stayStatus: 'COMPLETED' }),
        Booking.countDocuments({
          reservationStatus: ReservationStatus.CONFIRMED,
          stayStatus: StayStatus.NOT_CHECKED_IN,
        }),
      ]);

      sendSuccess(res, stays, 'Stays retrieved', 200, {
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
    } catch (error) {
      next(error);
    }
  }

  public static async getStay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const stay = await StayRecord.findById(id)
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
        throw new NotFoundError('Stay record not found');
      }

      sendSuccess(res, stay, 'Stay details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add incidental charge to active stay
   */
  public static async addCharge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { description, amount, category = 'OTHER' } = req.body;

      if (!description || !amount || amount <= 0) {
        throw new BadRequestError('Valid charge description and positive amount are required');
      }

      const stay = await StayRecord.findById(id);
      if (!stay) {
        throw new NotFoundError('Stay record not found');
      }

      if (stay.stayStatus !== 'ACTIVE') {
        throw new BadRequestError('Cannot add charges to completed stay');
      }

      stay.additionalCharges.push({
        description,
        amount: Number(amount),
        category,
        addedBy: new mongoose.Types.ObjectId(req.user!.id),
        addedAt: new Date(),
      });

      await stay.save();

      const booking = await Booking.findById(stay.bookingId);
      if (booking) {
        booking.extraCharges = (booking.extraCharges || 0) + Number(amount);
        booking.totalAmount = (booking.totalAmount || 0) + Number(amount);
        await booking.save();
      }

      sendSuccess(res, stay, 'Incidental charge added successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}
