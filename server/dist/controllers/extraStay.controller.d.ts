import { Request, Response, NextFunction } from 'express';
export declare class ExtraStayController {
    /**
     * Guest or Front Desk submits an extension request
     */
    static submitRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Admin lists all requests
     */
    static listRequests(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Admin approves extension request
     */
    static approveRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Admin rejects extension request
     */
    static rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Guest looks up status of their requests
     */
    static getBookingRequests(req: Request, res: Response, next: NextFunction): Promise<void>;
}
