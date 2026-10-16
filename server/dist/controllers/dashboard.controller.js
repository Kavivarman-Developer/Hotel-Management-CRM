"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const Booking_1 = require("../models/Booking");
const AuditLog_1 = require("../models/AuditLog");
const response_1 = require("../utils/response");
const types_1 = require("../types");
class DashboardController {
    static async getDashboard(req, res, next) {
        try {
            const { date } = req.query;
            const data = await dashboard_service_1.DashboardService.getDashboardMetrics(date);
            (0, response_1.sendSuccess)(res, data, 'Dashboard metrics retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async getOccupancyReport(req, res, next) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const startDate = req.query.startDate || today;
            const endDate = req.query.endDate || today;
            const data = await dashboard_service_1.DashboardService.getOccupancyReport(startDate, endDate);
            (0, response_1.sendSuccess)(res, data, 'Occupancy report generated');
        }
        catch (error) {
            next(error);
        }
    }
    static async getRevenueReport(req, res, next) {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const data = await dashboard_service_1.DashboardService.getRevenueReport(startDate, endDate);
            (0, response_1.sendSuccess)(res, data, 'Revenue report generated');
        }
        catch (error) {
            next(error);
        }
    }
    static async getBookingsReport(req, res, next) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
            const skip = (page - 1) * limit;
            const total = await Booking_1.Booking.countDocuments();
            const bookings = await Booking_1.Booking.find()
                .populate('guestId', 'fullName email mobile')
                .populate('assignedRoomId', 'roomNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            (0, response_1.sendSuccess)(res, bookings, 'Bookings report generated', 200, {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCheckInsReport(req, res, next) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const date = req.query.date || today;
            const arrivals = await Booking_1.Booking.find({
                checkInDate: date,
                reservationStatus: types_1.ReservationStatus.CONFIRMED,
            })
                .populate('guestId', 'fullName email mobile')
                .populate('assignedRoomId', 'roomNumber');
            (0, response_1.sendSuccess)(res, arrivals, 'Daily arrivals & check-in list retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async getCheckOutsReport(req, res, next) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const date = req.query.date || today;
            const departures = await Booking_1.Booking.find({
                checkOutDate: date,
                reservationStatus: types_1.ReservationStatus.CONFIRMED,
            })
                .populate('guestId', 'fullName email mobile')
                .populate('assignedRoomId', 'roomNumber');
            (0, response_1.sendSuccess)(res, departures, 'Daily departures & check-out list retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async getAuditLogs(req, res, next) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
            const skip = (page - 1) * limit;
            const filter = {};
            if (req.query.entityType)
                filter.entityType = req.query.entityType;
            if (req.query.action)
                filter.action = req.query.action;
            const total = await AuditLog_1.AuditLog.countDocuments(filter);
            const logs = await AuditLog_1.AuditLog.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit);
            (0, response_1.sendSuccess)(res, logs, 'Audit logs retrieved', 200, {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map