import { Request, Response, NextFunction } from 'express';
import { QrService } from '../services/qr.service';
import { GuestRegistration } from '../models/GuestRegistration';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export class QrController {
  public static async validateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.params.token as string;
      const result = await QrService.validateToken(token);
      sendSuccess(res, result, 'Token validated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async submitRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = ((req.headers['x-qr-token'] as string) || req.body.token) as string;
      const result = await QrService.submitRegistration(token, req.body);
      sendSuccess(
        res,
        {
          id: result._id,
          verificationStatus: result.verificationStatus,
          submittedAt: result.submittedAt,
        },
        'Guest digital registration submitted successfully. Please present your government ID at the front desk upon arrival.',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  public static async submitWalkInRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await QrService.submitWalkInRegistration(req.body);
      sendSuccess(
        res,
        result,
        'Walk-in digital self-registration submitted successfully. Please show your confirmation code to reception.',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  public static async listRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.status) {
        filter.verificationStatus = req.query.status;
      }

      const total = await GuestRegistration.countDocuments(filter);
      const registrations = await GuestRegistration.find(filter)
        .populate('bookingId', 'bookingReference checkInDate checkOutDate stayStatus')
        .populate('guestId', 'fullName email mobile')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      sendSuccess(res, registrations, 'Registrations retrieved', 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const registration = await GuestRegistration.findById(id)
        .populate('bookingId')
        .populate('guestId')
        .populate('reviewedBy', 'name email');

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      sendSuccess(res, registration, 'Registration details retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async approveRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { notes } = req.body;
      const approved = await QrService.approveRegistration(id, req.user!.id, notes);
      sendSuccess(res, approved, 'Guest registration verified and approved');
    } catch (error) {
      next(error);
    }
  }

  public static async rejectRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const rejected = await QrService.rejectRegistration(id, req.user!.id, reason || 'Document verification failed');
      sendSuccess(res, rejected, 'Guest registration rejected');
    } catch (error) {
      next(error);
    }
  }

  public static async reissueQrToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await QrService.reissueQrToken(id, req.user!.id);
      sendSuccess(res, result, 'New QR registration token issued successfully');
    } catch (error) {
      next(error);
    }
  }
}
