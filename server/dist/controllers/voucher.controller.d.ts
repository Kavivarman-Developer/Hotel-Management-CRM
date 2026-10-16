import { Request, Response, NextFunction } from 'express';
export declare class VoucherController {
    static validate(req: Request, res: Response, next: NextFunction): Promise<void>;
    static listVouchers(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createVoucher(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateVoucher(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteVoucher(req: Request, res: Response, next: NextFunction): Promise<void>;
}
