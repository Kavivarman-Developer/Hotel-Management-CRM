import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static refresh(req: Request, res: Response, next: NextFunction): Promise<void>;
    static logout(req: Request, res: Response, next: NextFunction): Promise<void>;
    static me(req: Request, res: Response, next: NextFunction): Promise<void>;
    static listStaff(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createStaff(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void>;
    static toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}
