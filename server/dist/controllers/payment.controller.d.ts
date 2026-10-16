import { Request, Response, NextFunction } from 'express';
export declare class PaymentController {
    static createPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    static webhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminListPayments(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminRefundPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
}
