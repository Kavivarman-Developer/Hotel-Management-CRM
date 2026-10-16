import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { Booking } from '../models/Booking';
import { StayRecord } from '../models/StayRecord';
import { AuditLog } from '../models/AuditLog';
import { sendSuccess } from '../utils/response';
import { ReservationStatus, StayStatus } from '../types';

export class DashboardController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query as { date?: string };
      const data = await DashboardService.getDashboardMetrics(date);
      sendSuccess(res, data, 'Dashboard metrics retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getOccupancyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = (req.query.startDate as string) || today;
      const endDate = (req.query.endDate as string) || today;
      const data = await DashboardService.getOccupancyReport(startDate, endDate);
      sendSuccess(res, data, 'Occupancy report generated');
    } catch (error) {
      next(error);
    }
  }

  public static async getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const data = await DashboardService.getRevenueReport(startDate, endDate);
      sendSuccess(res, data, 'Revenue report generated');
    } catch (error) {
      next(error);
    }
  }

  public static async getBookingsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const skip = (page - 1) * limit;

      const total = await Booking.countDocuments();
      const bookings = await Booking.find()
        .populate('guestId', 'fullName email mobile')
        .populate('assignedRoomId', 'roomNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      sendSuccess(res, bookings, 'Bookings report generated', 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCheckInsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const date = (req.query.date as string) || today;

      const arrivals = await Booking.find({
        checkInDate: date,
        reservationStatus: ReservationStatus.CONFIRMED,
      })
        .populate('guestId', 'fullName email mobile')
        .populate('assignedRoomId', 'roomNumber');

      sendSuccess(res, arrivals, 'Daily arrivals & check-in list retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getCheckOutsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const date = (req.query.date as string) || today;

      const departures = await Booking.find({
        checkOutDate: date,
        reservationStatus: ReservationStatus.CONFIRMED,
      })
        .populate('guestId', 'fullName email mobile')
        .populate('assignedRoomId', 'roomNumber');

      sendSuccess(res, departures, 'Daily departures & check-out list retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.entityType) filter.entityType = req.query.entityType;
      if (req.query.action) filter.action = req.query.action;

      const total = await AuditLog.countDocuments(filter);
      const logs = await AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      sendSuccess(res, logs, 'Audit logs retrieved', 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }
}
