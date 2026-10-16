import { Request, Response, NextFunction } from 'express';
export declare class BookingController {
    static createHold(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    static cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminListBookings(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminCreateBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminUpdateBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminCancelBooking(req: Request, res: Response, next: NextFunction): Promise<void>;
}
