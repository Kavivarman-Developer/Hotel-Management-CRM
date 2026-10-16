import { Request, Response, NextFunction } from 'express';
export declare class PartnerController {
    static listPublicPartners(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getPublicPartner(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminListPartners(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminCreatePartner(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminUpdatePartner(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminDeletePartner(req: Request, res: Response, next: NextFunction): Promise<void>;
}
