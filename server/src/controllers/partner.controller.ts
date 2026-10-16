import { Request, Response, NextFunction } from 'express';
import { PartnerHotel } from '../models/PartnerHotel';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { PartnerListingStatus, PartnerApprovalStatus } from '../types';
import { logAudit } from '../utils/audit';

export class PartnerController {
  // Public listing: only approved and active
  public static async listPublicPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partners = await PartnerHotel.find({
        listingStatus: PartnerListingStatus.ACTIVE,
        approvalStatus: PartnerApprovalStatus.APPROVED,
      }).select('-__v');

      sendSuccess(res, partners, 'Partner hotels retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getPublicPartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const partner = await PartnerHotel.findOne({
        _id: id,
        listingStatus: PartnerListingStatus.ACTIVE,
        approvalStatus: PartnerApprovalStatus.APPROVED,
      });

      if (!partner) {
        throw new NotFoundError('Partner hotel not found or not active');
      }

      sendSuccess(res, partner, 'Partner hotel retrieved');
    } catch (error) {
      next(error);
    }
  }

  // Admin Management
  public static async adminListPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partners = await PartnerHotel.find().sort({ createdAt: -1 });
      sendSuccess(res, partners, 'All partner hotels retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async adminCreatePartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partner = await PartnerHotel.create({
        ...req.body,
        approvedBy: req.user!.id,
      });

      await logAudit({
        req,
        action: 'PARTNER_HOTEL_CREATED',
        entityType: 'PartnerHotel',
        entityId: partner._id.toString(),
        changes: { after: { name: partner.hotelName } },
      });

      sendSuccess(res, partner, 'Partner hotel listing created', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async adminUpdatePartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const partner = await PartnerHotel.findByIdAndUpdate(id, { $set: req.body }, { new: true });
      if (!partner) {
        throw new NotFoundError('Partner hotel not found');
      }

      await logAudit({
        req,
        action: 'PARTNER_HOTEL_UPDATED',
        entityType: 'PartnerHotel',
        entityId: id,
      });

      sendSuccess(res, partner, 'Partner hotel listing updated');
    } catch (error) {
      next(error);
    }
  }

  public static async adminDeletePartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const partner = await PartnerHotel.findByIdAndUpdate(id, {
        listingStatus: PartnerListingStatus.INACTIVE,
      });
      if (!partner) {
        throw new NotFoundError('Partner hotel not found');
      }

      await logAudit({
        req,
        action: 'PARTNER_HOTEL_DEACTIVATED',
        entityType: 'PartnerHotel',
        entityId: id,
      });

      sendSuccess(res, null, 'Partner hotel listing archived');
    } catch (error) {
      next(error);
    }
  }
}
