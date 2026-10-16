import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from '../services/availability.service';
import { sendSuccess } from '../utils/response';

export class AvailabilityController {
  public static async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { checkIn, checkOut, guests, rooms, roomTypeId, discountCode } = req.query as any;

      const result = await AvailabilityService.checkAvailability({
        checkIn,
        checkOut,
        guests: Number(guests),
        rooms: rooms ? Number(rooms) : 1,
        roomTypeId,
        discountCode,
      });

      sendSuccess(res, result, 'Availability search completed');
    } catch (error) {
      next(error);
    }
  }
}
