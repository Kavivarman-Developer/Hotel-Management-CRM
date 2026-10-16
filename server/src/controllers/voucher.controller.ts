import { Request, Response, NextFunction } from 'express';
import { VoucherService } from '../services/voucher.service';
import { sendSuccess } from '../utils/response';

export class VoucherController {
  public static async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, subtotal } = req.body;
      const result = await VoucherService.validateAndCalculate(code, Number(subtotal));
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async listVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const search = req.query.search as string;
      const isActive = req.query.isActive as string;

      const result = await VoucherService.listVouchers({ search, isActive }, page, limit);
      sendSuccess(res, result.vouchers, 'Vouchers retrieved', 200, {
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

  public static async createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const voucher = await VoucherService.createVoucher(req.body, req.user?.id);
      sendSuccess(res, voucher, 'Voucher created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async updateVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const voucher = await VoucherService.updateVoucher(id, req.body);
      sendSuccess(res, voucher, 'Voucher updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await VoucherService.deleteVoucher(id);
      sendSuccess(res, null, 'Voucher deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}
