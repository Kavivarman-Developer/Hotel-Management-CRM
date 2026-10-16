import mongoose, { ClientSession } from 'mongoose';
export declare const connectDatabase: (uri?: string) => Promise<typeof mongoose>;
export declare const disconnectDatabase: () => Promise<void>;
/**
 * Execute an operation within a MongoDB transaction with bounded retries for transient transaction errors.
 * Note: MongoDB transactions require a replica set or mongos. In standalone dev environments without a replica set,
 * this executes the operation directly with a logged warning.
 */
export declare const withTransaction: <T>(operation: (session: ClientSession | null) => Promise<T>, maxRetries?: number) => Promise<T>;
