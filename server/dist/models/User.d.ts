import mongoose, { Document } from 'mongoose';
import { UserRole, Permission } from '../types';
export interface IUser extends Document {
    name: string;
    email: string;
    mobile: string;
    passwordHash: string;
    role: UserRole;
    permissions: Permission[];
    isActive: boolean;
    lastLoginAt?: Date;
    refreshTokenHash?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
