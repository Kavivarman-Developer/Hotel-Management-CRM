import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            correlationId: string;
        }
    }
}
export declare const correlationIdMiddleware: (req: Request, res: Response, next: NextFunction) => void;
