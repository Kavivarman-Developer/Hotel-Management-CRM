import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { Booking } from '../models/Booking';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { BookingSource } from '../types';

export class BookingController {
  public static async createHold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idempotencyKey = req.header('Idempotency-Key');
      const result = await BookingService.createHold({
        ...req.body,
        idempotencyKey,
      });

      sendSuccess(
        res,
        {
          holdId: result.hold._id,
          holdToken: result.holdToken,
          roomId: result.hold.roomId,
          checkInDate: result.hold.checkInDate,
          checkOutDate: result.hold.checkOutDate,
          expiresAt: result.expiresAt,
          pricing: result.pricing,
        },
        'Room hold created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  public static async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idempotencyKey = req.header('Idempotency-Key');
      const result = await BookingService.createBooking({
        ...req.body,
        idempotencyKey,
        source: BookingSource.WEBSITE,
      });

      sendSuccess(
        res,
        {
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
        },
        'Booking created and confirmed successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reference = req.params.reference as string;
      const { email, mobile } = req.query as { email?: string; mobile?: string };
      const isStaff = Boolean(req.user);

      const booking = await BookingService.getBookingByReference(reference, { email, mobile }, isStaff);
      sendSuccess(res, booking, 'Booking details retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reference = req.params.reference as string;
      const { reason } = req.body;
      const cancelled = await BookingService.cancelBooking(reference, reason, req.user?.id, Boolean(req.user));
      sendSuccess(res, cancelled, 'Booking cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Admin Booking Handlers ---
  public static async adminListBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const filter: any = {};
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

      const total = await Booking.countDocuments(filter);
      const bookings = await Booking.find(filter)
        .populate('guestId', 'fullName email mobile')
        .populate('assignedRoomId', 'roomNumber floor')
        .populate('roomTypeId', 'name code category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      sendSuccess(
        res,
        bookings,
        'Bookings retrieved',
        200,
        {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      );
    } catch (error) {
      next(error);
    }
  }

  public static async adminCreateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idempotencyKey = req.header('Idempotency-Key');
      const result = await BookingService.createBooking({
        ...req.body,
        source: req.body.source || BookingSource.FRONT_DESK,
        createdBy: req.user!.id,
        idempotencyKey,
      });

      sendSuccess(
        res,
        {
          booking: result.booking,
          pricing: result.pricing,
          qrToken: result.qrToken,
        },
        'Staff reservation created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  public static async adminUpdateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { specialRequests, paymentStatus, numberOfGuests } = req.body;

      const booking = await Booking.findById(id);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (specialRequests !== undefined) booking.specialRequests = specialRequests;
      if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus;
      if (numberOfGuests !== undefined) booking.numberOfGuests = numberOfGuests;

      await booking.save();
      sendSuccess(res, booking, 'Booking updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async adminCancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const cancelled = await BookingService.cancelBooking(id, reason || 'Staff Cancellation', req.user!.id, true);
      sendSuccess(res, cancelled, 'Booking cancelled by staff successfully');
    } catch (error) {
      next(error);
    }
  }
}
