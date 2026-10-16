import mongoose, { Document } from 'mongoose';
export interface IRoomInventoryLock extends Document {
    roomId: mongoose.Types.ObjectId;
    version: number;
    lastLockedAt: Date;
    lockedByOperation?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RoomInventoryLock: mongoose.Model<IRoomInventoryLock, {}, {}, {}, mongoose.Document<unknown, {}, IRoomInventoryLock, {}, {}> & IRoomInventoryLock & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
