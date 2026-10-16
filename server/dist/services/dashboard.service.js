"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const Room_1 = require("../models/Room");
const Booking_1 = require("../models/Booking");
const StayRecord_1 = require("../models/StayRecord");
const Payment_1 = require("../models/Payment");
const Refund_1 = require("../models/Refund");
const types_1 = require("../types");
class DashboardService {
    /**
     * Returns current operational dashboard metrics calculated directly from database records.
     */
    static async getDashboardMetrics(targetDateStr) {
        const today = targetDateStr || new Date().toISOString().split('T')[0];
        // 1. Room Counts by Physical Status
        const totalRooms = await Room_1.Room.countDocuments();
        const activeRooms = await Room_1.Room.countDocuments({ status: types_1.RoomStatus.ACTIVE });
        const maintenanceRooms = await Room_1.Room.countDocuments({
            $or: [
                { status: types_1.RoomStatus.MAINTENANCE },
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
        const activeStayRecords = await StayRecord_1.StayRecord.countDocuments({ stayStatus: 'ACTIVE' });
        const activeCheckedInBookings = await Booking_1.Booking.countDocuments({
            reservationStatus: types_1.ReservationStatus.CONFIRMED,
            stayStatus: types_1.StayStatus.CHECKED_IN,
        });
        const occupiedStays = Math.max(activeStayRecords, activeCheckedInBookings);
        // 3. Reserved Rooms for Today (Confirmed bookings staying today)
        const reservedRooms = await Booking_1.Booking.countDocuments({
            reservationStatus: types_1.ReservationStatus.CONFIRMED,
            stayStatus: types_1.StayStatus.NOT_CHECKED_IN,
            checkInDate: { $lte: today },
            checkOutDate: { $gt: today },
        });
        // Available inventory
        const availableInventory = Math.max(0, activeRooms - occupiedStays - reservedRooms - maintenanceRooms);
        // 4. Today's Arrivals (Check-in date is today)
        const arrivalsToday = await Booking_1.Booking.countDocuments({
            reservationStatus: types_1.ReservationStatus.CONFIRMED,
            checkInDate: today,
        });
        // 5. Today's Departures (Check-out date is today)
        const departuresToday = await Booking_1.Booking.countDocuments({
            reservationStatus: types_1.ReservationStatus.CONFIRMED,
            checkOutDate: today,
        });
        // 6. Checked-in guests count today
        const checkedInGuests = await Booking_1.Booking.countDocuments({
            stayStatus: types_1.StayStatus.CHECKED_IN,
        });
        // 7. Confirmed bookings count
        const totalConfirmedBookings = await Booking_1.Booking.countDocuments({
            reservationStatus: types_1.ReservationStatus.CONFIRMED,
        });
        // 8. Financial aggregates from Payment collection (verified actual PAID payments only)
        const revenueAgg = await Payment_1.Payment.aggregate([
            { $match: { paymentStatus: types_1.PaymentStatus.SUCCESS } },
            { $group: { _id: null, totalPaidRevenue: { $sum: '$amount' } } },
        ]);
        const paidRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalPaidRevenue : 0;
        // Outstanding payments on confirmed bookings
        const outstandingAgg = await Booking_1.Booking.aggregate([
            {
                $match: {
                    reservationStatus: types_1.ReservationStatus.CONFIRMED,
                    paymentStatus: { $in: [types_1.PaymentStatus.PENDING, types_1.PaymentStatus.PARTIAL] },
                },
            },
            { $group: { _id: null, totalOutstanding: { $sum: '$totalAmount' } } },
        ]);
        const outstandingPayments = outstandingAgg.length > 0 ? outstandingAgg[0].totalOutstanding : 0;
        // Total Refunds
        const refundAgg = await Refund_1.Refund.aggregate([
            { $group: { _id: null, totalRefunds: { $sum: '$amount' } } },
        ]);
        const totalRefunds = refundAgg.length > 0 ? refundAgg[0].totalRefunds : 0;
        // Occupancy Rate: occupied / total active rooms * 100
        const occupancyRate = activeRooms > 0 ? Math.round((occupiedStays / activeRooms) * 100) : 0;
        // 9. Real Channel Breakdown from Booking collection
        const directCount = await Booking_1.Booking.countDocuments({
            source: { $in: [types_1.BookingSource.WEBSITE, 'DIRECT', types_1.BookingSource.ADMIN] },
        });
        const walkInCount = await Booking_1.Booking.countDocuments({
            source: { $in: [types_1.BookingSource.WALK_IN, types_1.BookingSource.FRONT_DESK] },
        });
        const partnerCount = await Booking_1.Booking.countDocuments({
            source: { $in: [types_1.BookingSource.PARTNER_OTA, 'PARTNER'] },
        });
        const otherCount = Math.max(0, totalConfirmedBookings - directCount - walkInCount - partnerCount);
        const totalChannelCount = totalConfirmedBookings;
        const directPercentage = totalChannelCount > 0 ? Math.round((directCount / totalChannelCount) * 100) : 0;
        const walkInPercentage = totalChannelCount > 0 ? Math.round((walkInCount / totalChannelCount) * 100) : 0;
        const partnerPercentage = totalChannelCount > 0 ? Math.round((partnerCount / totalChannelCount) * 100) : 0;
        const otherPercentage = totalChannelCount > 0 ? Math.max(0, 100 - directPercentage - walkInPercentage - partnerPercentage) : 0;
        // Offline (Walk-in / Front Desk) vs Online / Platform revenue from actual bookings/payments
        const offlineRevenueAgg = await Booking_1.Booking.aggregate([
            {
                $match: {
                    source: { $in: [types_1.BookingSource.WALK_IN, types_1.BookingSource.FRONT_DESK] },
                    reservationStatus: types_1.ReservationStatus.CONFIRMED,
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        const offlineRevenuePaise = offlineRevenueAgg.length > 0 ? offlineRevenueAgg[0].total : 0;
        const platformRevenuePaise = Math.max(0, paidRevenue - offlineRevenuePaise);
        // 10. Real Occupancy Timeline for the Current Month across sample days
        const [yearStr, monthStr] = today.split('-');
        const sampleDays = [1, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
        const dailyTimeline = await Promise.all(sampleDays.map(async (d) => {
            const dayFormatted = String(d).padStart(2, '0');
            const checkDate = `${yearStr}-${monthStr}-${dayFormatted}`;
            const dayOccupied = await Booking_1.Booking.countDocuments({
                reservationStatus: {
                    $in: [types_1.ReservationStatus.CONFIRMED, types_1.ReservationStatus.PENDING_PAYMENT, types_1.ReservationStatus.HELD],
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
        }));
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
    static async getOccupancyReport(startDate, endDate) {
        const totalRooms = await Room_1.Room.countDocuments({ status: types_1.RoomStatus.ACTIVE });
        const bookings = await Booking_1.Booking.find({
            reservationStatus: types_1.ReservationStatus.CONFIRMED,
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
    static async getRevenueReport(startDate, endDate) {
        const match = { paymentStatus: types_1.PaymentStatus.SUCCESS };
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate)
                match.createdAt.$gte = new Date(startDate);
            if (endDate)
                match.createdAt.$lte = new Date(endDate);
        }
        const payments = await Payment_1.Payment.find(match).sort({ createdAt: -1 }).limit(100).lean();
        const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
        return {
            totalRevenuePaise: totalRevenue,
            totalRevenueFormatted: `₹${(totalRevenue / 100).toLocaleString('en-IN')}`,
            transactionsCount: payments.length,
            payments,
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map