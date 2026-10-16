import mongoose, { Document } from 'mongoose';
export interface IRoomType extends Document {
    name: string;
    code: string;
    description: string;
    tagline?: string;
    category: string;
    maxOccupancy: {
        adults: number;
        children: number;
        total: number;
    };
    bedConfiguration: string;
    amenities: string[];
    features: string[];
    images: string[];
    baseRate: number;
    defaultNightlyRate: number;
    sizeSqFt?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RoomType: mongoose.Model<IRoomType, {}, {}, {}, mongoose.Document<unknown, {}, IRoomType, {}, {}> & IRoomType & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
