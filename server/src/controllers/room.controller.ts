import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { RatePlan } from '../models/RatePlan';
import { Booking } from '../models/Booking';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { RoomStatus, HousekeepingStatus, ReservationStatus } from '../types';
import { logAudit } from '../utils/audit';

export class RoomController {
  // --- Public Room Endpoints ---
  public static async listPublicRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await Room.find({ status: RoomStatus.ACTIVE })
        .populate('roomTypeId', 'name code category bedConfiguration amenities images defaultNightlyRate')
        .select('-maintenanceInfo');

      sendSuccess(res, rooms, 'Rooms retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getPublicRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const room = await Room.findOne({ _id: id, status: RoomStatus.ACTIVE })
        .populate('roomTypeId')
        .select('-maintenanceInfo');

      if (!room) {
        throw new NotFoundError('Room not found');
      }

      sendSuccess(res, room, 'Room retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async listRoomTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomTypes = await RoomType.find({ isActive: true });
      sendSuccess(res, roomTypes, 'Room types retrieved');
    } catch (error) {
      next(error);
    }
  }

  // --- Admin Room Management ---
  public static async adminListRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await Room.find()
        .populate('roomTypeId')
        .populate('maintenanceInfo.blockedBy', 'name email')
        .sort({ roomNumber: 1 });

      const todayStr = new Date().toISOString().split('T')[0];

      // Find all active bookings overlapping today
      const activeBookings = await Booking.find({
        reservationStatus: {
          $in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING_PAYMENT, ReservationStatus.HELD],
        },
        checkInDate: { $lte: todayStr },
        checkOutDate: { $gt: todayStr },
      }).populate('guestId', 'fullName mobile email');

      const activeBookingMap = new Map<string, any>();
      for (const b of activeBookings) {
        if (b.assignedRoomId) {
          activeBookingMap.set(b.assignedRoomId.toString(), b);
        }
      }

      const enrichedRooms = rooms.map((room) => {
        const roomObj: any = room.toObject();
        const activeBooking = activeBookingMap.get(room._id.toString());
        roomObj.isOccupied = Boolean(activeBooking);
        if (activeBooking) {
          roomObj.currentBooking = {
            bookingReference: activeBooking.bookingReference,
            guestName: (activeBooking.guestId as any)?.fullName || 'In-House Guest',
            guestMobile: (activeBooking.guestId as any)?.mobile,
            checkInDate: activeBooking.checkInDate,
            checkOutDate: activeBooking.checkOutDate,
            stayType: activeBooking.bookingType,
          };
        }
        return roomObj;
      });

      sendSuccess(res, enrichedRooms, 'All rooms retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async adminCreateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomNumber, roomTypeId, floor, maxGuests, amenities, status, housekeepingStatus } = req.body;

      const existing = await Room.findOne({ roomNumber: roomNumber.toUpperCase().trim() });
      if (existing) {
        throw new BadRequestError(`Room number ${roomNumber} already exists`);
      }

      const room = await Room.create({
        roomNumber: roomNumber.toUpperCase().trim(),
        roomTypeId,
        floor: floor || 1,
        maxGuests,
        amenities: amenities || [],
        status: status || RoomStatus.ACTIVE,
        housekeepingStatus: housekeepingStatus || HousekeepingStatus.CLEAN,
      });

      await logAudit({
        req,
        action: 'ROOM_CREATED',
        entityType: 'Room',
        entityId: room._id.toString(),
        changes: { after: { roomNumber: room.roomNumber } },
      });

      sendSuccess(res, room, 'Room created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async adminUpdateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const beforeRoom = await Room.findById(id);
      if (!beforeRoom) {
        throw new NotFoundError('Room not found');
      }

      const updatedRoom = await Room.findByIdAndUpdate(id, { $set: req.body }, { new: true });

      await logAudit({
        req,
        action: 'ROOM_UPDATED',
        entityType: 'Room',
        entityId: id,
        changes: { before: beforeRoom.toObject(), after: updatedRoom?.toObject() },
      });

      sendSuccess(res, updatedRoom, 'Room updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async adminAddMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { startDate, endDate, reason } = req.body;

      if (startDate >= endDate) {
        throw new BadRequestError('startDate must be before endDate');
      }

      const room = await Room.findById(id);
      if (!room) {
        throw new NotFoundError('Room not found');
      }

      // Check if room has active bookings during this maintenance window
      const conflictingBooking = await Booking.findOne({
        assignedRoomId: room._id,
        reservationStatus: { $in: ['CONFIRMED', 'PENDING_PAYMENT', 'HELD'] },
        checkInDate: { $lt: endDate },
        checkOutDate: { $gt: startDate },
      });

      if (conflictingBooking) {
        throw new BadRequestError(
          `Cannot schedule maintenance: Overlaps with confirmed reservation ${conflictingBooking.bookingReference}`
        );
      }

      room.maintenanceInfo.push({
        startDate,
        endDate,
        reason,
        blockedBy: new mongoose.Types.ObjectId(req.user!.id),
      });

      await room.save();

      await logAudit({
        req,
        action: 'MAINTENANCE_BLOCK_ADDED',
        entityType: 'Room',
        entityId: room._id.toString(),
        changes: { after: { startDate, endDate, reason } },
      });

      sendSuccess(res, room, 'Maintenance block added successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async adminRemoveMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { maintenanceId } = req.query as { maintenanceId?: string };

      const room = await Room.findById(id);
      if (!room) {
        throw new NotFoundError('Room not found');
      }

      if (maintenanceId) {
        room.maintenanceInfo = room.maintenanceInfo.filter(
          (m: any) => m._id.toString() !== maintenanceId
        );
      } else {
        // Clear all expired or all blocks if none specified
        room.maintenanceInfo = [];
      }

      await room.save();

      await logAudit({
        req,
        action: 'MAINTENANCE_BLOCK_REMOVED',
        entityType: 'Room',
        entityId: room._id.toString(),
      });

      sendSuccess(res, room, 'Maintenance block removed successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Admin Room Type & Rates ---
  public static async adminCreateRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomType = await RoomType.create(req.body);
      // Auto-create initial default rate plan for this room type
      await RatePlan.create({
        roomTypeId: roomType._id,
        defaultRate: roomType.defaultNightlyRate,
        currency: 'INR',
        isActive: true,
      });

      sendSuccess(res, roomType, 'Room type created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async adminUpdateRoomType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const roomType = await RoomType.findByIdAndUpdate(id, { $set: req.body }, { new: true });
      if (!roomType) throw new NotFoundError('Room type not found');
      sendSuccess(res, roomType, 'Room type updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async adminUpdateRatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const ratePlan = await RatePlan.findByIdAndUpdate(id, { $set: req.body }, { new: true });
      if (!ratePlan) throw new NotFoundError('Rate plan not found');
      sendSuccess(res, ratePlan, 'Rate plan updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
