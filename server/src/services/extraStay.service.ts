import mongoose from 'mongoose';
import { ExtraStayRequest, IExtraStayRequest } from '../models/ExtraStayRequest';
import { Booking } from '../models/Booking';
import { StayRecord } from '../models/StayRecord';
import { Room } from '../models/Room';
import { Guest } from '../models/Guest';
import { emitToAdmin, emitToGuest } from '../socket';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export class ExtraStayService {
  /**
   * Guest or Front Desk submits an extra stay / late checkout extension request
   */
  public static async createRequest(input: {
    bookingReference: string;
    requestedExtraHours: number;
    reason: string;
  }): Promise<IExtraStayRequest> {
    const { bookingReference, requestedExtraHours, reason } = input;
    const normalizedRef = bookingReference.toUpperCase().trim();

    const booking = await Booking.findOne({ bookingReference: normalizedRef });
    if (!booking) {
      throw new NotFoundError(`Booking '${normalizedRef}' not found`);
    }

    if (booking.reservationStatus === 'CANCELLED') {
      throw new BadRequestError('Cannot request extra stay for a cancelled booking');
    }

    if (booking.stayStatus === 'CHECKED_OUT') {
      throw new BadRequestError('Guest has already checked out of the hotel');
    }

    // Lookup room and guest
    const room = await Room.findById(booking.assignedRoomId);
    const guest = await Guest.findById(booking.guestId);

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
    const stay = await StayRecord.findOne({ bookingId: booking._id, stayStatus: 'ACTIVE' });

    const request = new ExtraStayRequest({
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
      emitToAdmin('extra_stay:new_request', {
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

      emitToAdmin('notification:new', {
        id: `notif_${Date.now()}`,
        type: 'EXTRA_STAY_REQUEST',
        title: `Extra Stay Request — Room ${roomNumber}`,
        message: `${guestName} requested +${requestedExtraHours} hrs extension (${newExpectedCheckOutTime}). Reason: ${reason}`,
        timestamp: new Date(),
        link: '/admin/extra-stays',
      });
    } catch (err: any) {
      console.warn('Socket broadcast warning:', err.message);
    }

    return request;
  }

  /**
   * List all extra stay requests with filter, pagination & stats
   */
  public static async listRequests(filter: any = {}, page = 1, limit = 50): Promise<{
    requests: IExtraStayRequest[];
    total: number;
    stats: {
      pending: number;
      approved: number;
      rejected: number;
      totalRevenuePaise: number;
    };
  }> {
    const skip = (page - 1) * limit;
    const query: any = {};

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
      ExtraStayRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('bookingId')
        .populate('actionedBy', 'name email'),
      ExtraStayRequest.countDocuments(query),
      ExtraStayRequest.find().select('status chargeAmountPaise'),
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
  public static async approveRequest(
    id: string,
    staffUserId: string,
    addToFolio: boolean = true,
    staffNotes?: string
  ): Promise<IExtraStayRequest> {
    const request = await ExtraStayRequest.findById(id);
    if (!request) {
      throw new NotFoundError('Extra stay request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestError(`Request is already ${request.status}`);
    }

    request.status = 'APPROVED';
    request.actionedBy = new mongoose.Types.ObjectId(staffUserId);
    request.actionedAt = new Date();
    if (staffNotes) request.staffNotes = staffNotes;

    // Add incidental to StayRecord and Booking if requested
    if (addToFolio) {
      request.paymentStatus = 'ADDED_TO_FOLIO';

      const booking = await Booking.findById(request.bookingId);
      if (booking) {
        booking.extraCharges = (booking.extraCharges || 0) + request.chargeAmountPaise;
        booking.totalAmount = (booking.totalAmount || 0) + request.chargeAmountPaise;
        await booking.save();
      }

      // If active stay exists, add charge item
      const stay = await StayRecord.findOne({
        bookingId: request.bookingId,
        stayStatus: 'ACTIVE',
      });
      if (stay) {
        stay.additionalCharges.push({
          description: `Approved Extension: +${request.requestedExtraHours} hrs past 11:00 AM (${request.newExpectedCheckOutTime})`,
          amount: request.chargeAmountPaise,
          category: 'OVERSTAY',
          addedBy: new mongoose.Types.ObjectId(staffUserId),
          addedAt: new Date(),
        });
        await stay.save();
      }
    }

    await request.save();

    await logAudit({
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
      emitToGuest(request.bookingReference, 'extra_stay:updated', {
        status: 'APPROVED',
        newExpectedCheckOutTime: request.newExpectedCheckOutTime,
        chargeAmountPaise: request.chargeAmountPaise,
        message: `Your extra stay request for +${request.requestedExtraHours} hours has been APPROVED by the front desk. New check-out time is ${request.newExpectedCheckOutTime}.`,
      });

      emitToAdmin('extra_stay:updated', request);
    } catch (err) {
      // non-blocking
    }

    return request;
  }

  /**
   * Reject an extra stay request with explanation
   */
  public static async rejectRequest(
    id: string,
    staffUserId: string,
    rejectionReason: string
  ): Promise<IExtraStayRequest> {
    const request = await ExtraStayRequest.findById(id);
    if (!request) {
      throw new NotFoundError('Extra stay request not found');
    }

    request.status = 'REJECTED';
    request.rejectionReason = rejectionReason;
    request.actionedBy = new mongoose.Types.ObjectId(staffUserId);
    request.actionedAt = new Date();

    await request.save();

    // Real-time notification to guest
    try {
      emitToGuest(request.bookingReference, 'extra_stay:updated', {
        status: 'REJECTED',
        rejectionReason,
        message: `Your extra stay request could not be approved. Reason: ${rejectionReason}. Please prepare for scheduled check-out at 11:00 AM.`,
      });

      emitToAdmin('extra_stay:updated', request);
    } catch (err) {
      // non-blocking
    }

    return request;
  }

  /**
   * Check status of requests for a specific booking reference
   */
  public static async getRequestsForBooking(bookingReference: string): Promise<IExtraStayRequest[]> {
    return await ExtraStayRequest.find({
      bookingReference: bookingReference.toUpperCase().trim(),
    }).sort({ createdAt: -1 });
  }
}
