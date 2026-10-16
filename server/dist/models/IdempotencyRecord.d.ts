import mongoose, { Document } from 'mongoose';
export interface IIdempotencyRecord extends Document {
    idempotencyKey: string;
    endpoint: string;
    requestHash: string;
    responseStatus: number;
    responseBody: any;
    expiresAt: Date;
    createdAt: Date;
}
export declare const IdempotencyRecord: mongoose.Model<IIdempotencyRecord, {}, {}, {}, mongoose.Document<unknown, {}, IIdempotencyRecord, {}, {}> & IIdempotencyRecord & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
