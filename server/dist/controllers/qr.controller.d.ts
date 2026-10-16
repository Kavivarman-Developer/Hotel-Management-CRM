import { Request, Response, NextFunction } from 'express';
export declare class QrController {
    static validateToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    static submitRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
    static submitWalkInRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
    static listRegistrations(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
    static approveRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
    static rejectRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
    static reissueQrToken(req: Request, res: Response, next: NextFunction): Promise<void>;
}
