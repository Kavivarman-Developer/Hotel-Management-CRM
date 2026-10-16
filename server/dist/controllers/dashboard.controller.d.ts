import { Request, Response, NextFunction } from 'express';
export declare class DashboardController {
    static getDashboard(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getOccupancyReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getBookingsReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getCheckInsReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getCheckOutsReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
}
