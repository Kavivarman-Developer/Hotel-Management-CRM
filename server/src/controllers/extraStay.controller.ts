import { Request, Response, NextFunction } from 'express';
import { ExtraStayService } from '../services/extraStay.service';
import { sendSuccess } from '../utils/response';

export class ExtraStayController {
  /**
   * Guest or Front Desk submits an extension request
   */
  public static async submitRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ExtraStayService.createRequest(req.body);
      sendSuccess(res, result, 'Extra stay request submitted successfully. Awaiting front desk approval.', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin lists all requests
   */
  public static async listRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const status = req.query.status as string;
      const search = req.query.search as string;

      const result = await ExtraStayService.listRequests({ status, search }, page, limit);
      sendSuccess(res, result.requests, 'Extra stay requests retrieved', 200, {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
        stats: result.stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin approves extension request
   */
  public static async approveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { addToFolio = true, staffNotes } = req.body;
      const result = await ExtraStayService.approveRequest(id, req.user!.id, addToFolio, staffNotes);
      sendSuccess(res, result, 'Extra stay extension approved and charges logged to folio.', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin rejects extension request
   */
  public static async rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { rejectionReason } = req.body;
      const result = await ExtraStayService.rejectRequest(id, req.user!.id, rejectionReason);
      sendSuccess(res, result, 'Extra stay extension rejected.', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Guest looks up status of their requests
   */
  public static async getBookingRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reference = req.params.reference as string;
      const results = await ExtraStayService.getRequestsForBooking(reference);
      sendSuccess(res, results, 'Extra stay requests retrieved for booking', 200);
    } catch (error) {
      next(error);
    }
  }
}
