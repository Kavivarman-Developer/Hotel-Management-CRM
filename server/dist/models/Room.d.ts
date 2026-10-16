import mongoose, { Document } from 'mongoose';
import { RoomStatus, HousekeepingStatus } from '../types';
export interface IMaintenanceBlock {
    _id?: mongoose.Types.ObjectId;
    startDate: string;
    endDate: string;
    reason: string;
    blockedBy?: mongoose.Types.ObjectId;
    createdAt?: Date;
}
export interface IRoom extends Document {
    roomNumber: string;
    roomTypeId: mongoose.Types.ObjectId;
    floor: number;
    maxGuests: number;
    amenities: string[];
    status: RoomStatus;
    housekeepingStatus: HousekeepingStatus;
    maintenanceInfo: IMaintenanceBlock[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Room: mongoose.Model<IRoom, {}, {}, {}, mongoose.Document<unknown, {}, IRoom, {}, {}> & IRoom & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
