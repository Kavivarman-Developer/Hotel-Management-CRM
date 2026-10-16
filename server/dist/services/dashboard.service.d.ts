import mongoose from 'mongoose';
export declare class DashboardService {
    /**
     * Returns current operational dashboard metrics calculated directly from database records.
     */
    static getDashboardMetrics(targetDateStr?: string): Promise<{
        date: string;
        occupancy: {
            totalRooms: number;
            activeRooms: number;
            availableInventory: number;
            occupiedRooms: number;
            reservedRooms: number;
            maintenanceRooms: number;
            occupancyRatePercentage: number;
        };
        operations: {
            arrivalsToday: number;
            departuresToday: number;
            checkedInGuests: number;
            confirmedBookings: number;
        };
        financials: {
            currency: string;
            paidRevenuePaise: any;
            paidRevenueFormatted: string;
            outstandingPaymentsPaise: any;
            outstandingPaymentsFormatted: string;
            totalRefundsPaise: any;
            totalRefundsFormatted: string;
            netRevenuePaise: number;
        };
        channelBreakdown: {
            directCount: number;
            walkInCount: number;
            partnerCount: number;
            otherCount: number;
            directPercentage: number;
            walkInPercentage: number;
            partnerPercentage: number;
            otherPercentage: number;
            offlineRevenuePaise: any;
            platformRevenuePaise: number;
        };
        dailyTimeline: {
            name: string;
            date: string;
            occupied: number;
            available: number;
            notReady: number;
            total: number;
        }[];
    }>;
    /**
     * Occupancy report over date range
     */
    static getOccupancyReport(startDate: string, endDate: string): Promise<{
        startDate: string;
        endDate: string;
        totalActiveRooms: number;
        overlappingReservations: number;
        bookings: {
            reference: string;
            checkInDate: string;
            checkOutDate: string;
            roomNumber: mongoose.Types.ObjectId;
        }[];
    }>;
    /**
     * Revenue report with verified payments breakdown
     */
    static getRevenueReport(startDate?: string, endDate?: string): Promise<{
        totalRevenuePaise: number;
        totalRevenueFormatted: string;
        transactionsCount: number;
        payments: (mongoose.FlattenMaps<import("../models/Payment").IPayment> & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
}
