import { Request, Response, NextFunction } from 'express';
export declare class RoomController {
    static listPublicRooms(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getPublicRoom(req: Request, res: Response, next: NextFunction): Promise<void>;
    static listRoomTypes(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminListRooms(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminCreateRoom(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminUpdateRoom(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminAddMaintenance(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminRemoveMaintenance(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminCreateRoomType(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminUpdateRoomType(req: Request, res: Response, next: NextFunction): Promise<void>;
    static adminUpdateRatePlan(req: Request, res: Response, next: NextFunction): Promise<void>;
}
