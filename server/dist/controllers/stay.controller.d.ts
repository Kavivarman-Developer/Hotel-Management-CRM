import { Request, Response, NextFunction } from 'express';
export declare class StayController {
    /**
     * List expected arrivals (confirmed bookings pending check-in)
     */
    static listArrivals(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Complete check-in for a booking or existing stay record
     */
    static checkIn(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Complete check-out, record charges, release room
     */
    static checkOut(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getOverstayPreview(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * List stays with status translation and deep population
     */
    static listStays(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getStay(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Add incidental charge to active stay
     */
    static addCharge(req: Request, res: Response, next: NextFunction): Promise<void>;
}
