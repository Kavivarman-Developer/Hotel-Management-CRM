import mongoose from 'mongoose';
import { Room } from '../models/Room';
import { Booking } from '../models/Booking';
import { StayRecord } from '../models/StayRecord';
import { Payment } from '../models/Payment';
import { Refund } from '../models/Refund';
import { AuditLog } from '../models/AuditLog';
import { ReservationStatus, StayStatus, PaymentStatus, RoomStatus, BookingSource } from '../types';

export class DashboardService {
  /**
   * Returns current operational dashboard metrics calculated directly from database records.
   */
  public static async getDashboardMetrics(targetDateStr?: string) {
    const today = targetDateStr || new Date().toISOString().split('T')[0];

    // 1. Room Counts by Physical Status
    const totalRooms = await Room.countDocuments();
    const activeRooms = await Room.countDocuments({ status: RoomStatus.ACTIVE });
    const maintenanceRooms = await Room.countDocuments({
      $or: [
        { status: RoomStatus.MAINTENANCE },
        {
          maintenanceInfo: {
            $elemMatch: {
              startDate: { $lte: today },
              endDate: { $gt: today },
            },
          },
        },
      ],
    });

    // 2. Currently Occupied Rooms (Checked In)
    const activeStayRecords = await StayRecord.countDocuments({ stayStatus: 'ACTIVE' });
    const activeCheckedInBookings = await Booking.countDocuments({
      reservationStatus: ReservationStatus.CONFIRMED,
      stayStatus: StayStatus.CHECKED_IN,
    });
    const occupiedStays = Math.max(activeStayRecords, activeCheckedInBookings);

    // 3. Reserved Rooms for Today (Confirmed bookings staying today)
    const reservedRooms = await Booking.countDocuments({
      reservationStatus: ReservationStatus.CONFIRMED,
      stayStatus: StayStatus.NOT_CHECKED_IN,
      checkInDate: { $lte: today },
      checkOutDate: { $gt: today },
    });

    // Available inventory
    const availableInventory = Math.max(0, activeRooms - occupiedStays - reservedRooms - maintenanceRooms);

    // 4. Today's Arrivals (Check-in date is today)
    const arrivalsToday = await Booking.countDocuments({
      reservationStatus: ReservationStatus.CONFIRMED,
      checkInDate: today,
    });

    // 5. Today's Departures (Check-out date is today)
    const departuresToday = await Booking.countDocuments({
      reservationStatus: ReservationStatus.CONFIRMED,
      checkOutDate: today,
    });

    // 6. Checked-in guests count today
    const checkedInGuests = await Booking.countDocuments({
      stayStatus: StayStatus.CHECKED_IN,
    });

    // 7. Confirmed bookings count
    const totalConfirmedBookings = await Booking.countDocuments({
      reservationStatus: ReservationStatus.CONFIRMED,
    });

    // 8. Financial aggregates from Payment collection (verified actual PAID payments only)
    const revenueAgg = await Payment.aggregate([
      { $match: { paymentStatus: PaymentStatus.SUCCESS } },
      { $group: { _id: null, totalPaidRevenue: { $sum: '$amount' } } },
    ]);
    const paidRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalPaidRevenue : 0;

    // Outstanding payments on confirmed bookings
    const outstandingAgg = await Booking.aggregate([
      {
        $match: {
          reservationStatus: ReservationStatus.CONFIRMED,
          paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        },
      },
      { $group: { _id: null, totalOutstanding: { $sum: '$totalAmount' } } },
    ]);
    const outstandingPayments = outstandingAgg.length > 0 ? outstandingAgg[0].totalOutstanding : 0;

    // Total Refunds
    const refundAgg = await Refund.aggregate([
      { $group: { _id: null, totalRefunds: { $sum: '$amount' } } },
    ]);
    const totalRefunds = refundAgg.length > 0 ? refundAgg[0].totalRefunds : 0;

    // Occupancy Rate: occupied / total active rooms * 100
    const occupancyRate = activeRooms > 0 ? Math.round((occupiedStays / activeRooms) * 100) : 0;

    // 9. Real Channel Breakdown from Booking collection
    const directCount = await Booking.countDocuments({
      source: { $in: [BookingSource.WEBSITE, 'DIRECT', BookingSource.ADMIN] },
    });
    const walkInCount = await Booking.countDocuments({
      source: { $in: [BookingSource.WALK_IN, BookingSource.FRONT_DESK] },
    });
    const partnerCount = await Booking.countDocuments({
      source: { $in: [BookingSource.PARTNER_OTA, 'PARTNER'] },
    });
    const otherCount = Math.max(0, totalConfirmedBookings - directCount - walkInCount - partnerCount);

    const totalChannelCount = totalConfirmedBookings;
    const directPercentage = totalChannelCount > 0 ? Math.round((directCount / totalChannelCount) * 100) : 0;
    const walkInPercentage = totalChannelCount > 0 ? Math.round((walkInCount / totalChannelCount) * 100) : 0;
    const partnerPercentage = totalChannelCount > 0 ? Math.round((partnerCount / totalChannelCount) * 100) : 0;
    const otherPercentage = totalChannelCount > 0 ? Math.max(0, 100 - directPercentage - walkInPercentage - partnerPercentage) : 0;

    // Offline (Walk-in / Front Desk) vs Online / Platform revenue from actual bookings/payments
    const offlineRevenueAgg = await Booking.aggregate([
      {
        $match: {
          source: { $in: [BookingSource.WALK_IN, BookingSource.FRONT_DESK] },
          reservationStatus: ReservationStatus.CONFIRMED,
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const offlineRevenuePaise = offlineRevenueAgg.length > 0 ? offlineRevenueAgg[0].total : 0;
    const platformRevenuePaise = Math.max(0, paidRevenue - offlineRevenuePaise);

    // 10. Real Occupancy Timeline for the Current Month across sample days
    const [yearStr, monthStr] = today.split('-');
    const sampleDays = [1, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
    const dailyTimeline = await Promise.all(
      sampleDays.map(async (d) => {
        const dayFormatted = String(d).padStart(2, '0');
        const checkDate = `${yearStr}-${monthStr}-${dayFormatted}`;
        const dayOccupied = await Booking.countDocuments({
          reservationStatus: {
            $in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING_PAYMENT, ReservationStatus.HELD],
          },
          checkInDate: { $lte: checkDate },
          checkOutDate: { $gt: checkDate },
        });

        const dayAvailable = Math.max(0, activeRooms - dayOccupied - maintenanceRooms);

        return {
          name: dayFormatted,
          date: checkDate,
          occupied: dayOccupied,
          available: dayAvailable,
          notReady: maintenanceRooms,
          total: totalRooms,
        };
      })
    );

    return {
      date: today,
      occupancy: {
        totalRooms,
        activeRooms,
        availableInventory,
        occupiedRooms: occupiedStays,
        reservedRooms,
        maintenanceRooms,
        occupancyRatePercentage: occupancyRate,
      },
      operations: {
        arrivalsToday,
        departuresToday,
        checkedInGuests,
        confirmedBookings: totalConfirmedBookings,
      },
      financials: {
        currency: 'INR',
        paidRevenuePaise: paidRevenue,
        paidRevenueFormatted: `₹${(paidRevenue / 100).toLocaleString('en-IN')}`,
        outstandingPaymentsPaise: outstandingPayments,
        outstandingPaymentsFormatted: `₹${(outstandingPayments / 100).toLocaleString('en-IN')}`,
        totalRefundsPaise: totalRefunds,
        totalRefundsFormatted: `₹${(totalRefunds / 100).toLocaleString('en-IN')}`,
        netRevenuePaise: Math.max(0, paidRevenue - totalRefunds),
      },
      channelBreakdown: {
        directCount,
        walkInCount,
        partnerCount,
        otherCount,
        directPercentage,
        walkInPercentage,
        partnerPercentage,
        otherPercentage,
        offlineRevenuePaise,
        platformRevenuePaise,
      },
      dailyTimeline,
    };
  }

  /**
   * Occupancy report over date range
   */
  public static async getOccupancyReport(startDate: string, endDate: string) {
    const totalRooms = await Room.countDocuments({ status: RoomStatus.ACTIVE });
    const bookings = await Booking.find({
      reservationStatus: ReservationStatus.CONFIRMED,
      checkInDate: { $lt: endDate },
      checkOutDate: { $gt: startDate },
    }).lean();

    return {
      startDate,
      endDate,
      totalActiveRooms: totalRooms,
      overlappingReservations: bookings.length,
      bookings: bookings.map((b) => ({
        reference: b.bookingReference,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        roomNumber: b.assignedRoomId,
      })),
    };
  }

  /**
   * Revenue report with verified payments breakdown
   */
  public static async getRevenueReport(startDate?: string, endDate?: string) {
    const match: any = { paymentStatus: PaymentStatus.SUCCESS };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(match).sort({ createdAt: -1 }).limit(100).lean();
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    return {
      totalRevenuePaise: totalRevenue,
      totalRevenueFormatted: `₹${(totalRevenue / 100).toLocaleString('en-IN')}`,
      transactionsCount: payments.length,
      payments,
    };
  }
}
