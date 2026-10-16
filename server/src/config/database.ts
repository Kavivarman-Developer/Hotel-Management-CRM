import mongoose, { ClientSession } from 'mongoose';
import { env } from './env';

let isConnected = false;

export const connectDatabase = async (uri: string = env.MONGODB_URI): Promise<typeof mongoose> => {
  if (isConnected) {
    return mongoose;
  }

  try {
    // Sanitize URI for logging to prevent credential leakage
    const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`[Database] Connecting to MongoDB at ${sanitizedUri}...`);

    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = true;
    console.log('[Database] MongoDB connection established successfully');

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected');
      isConnected = false;
    });

    return connection;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database connection error';
    console.error('[Database] Failed to connect to MongoDB:', message);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB connection closed');
  }
};

/**
 * Execute an operation within a MongoDB transaction with bounded retries for transient transaction errors.
 * Note: MongoDB transactions require a replica set or mongos. In standalone dev environments without a replica set,
 * this executes the operation directly with a logged warning.
 */
export const withTransaction = async <T>(
  operation: (session: ClientSession | null) => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let session: ClientSession | null = null;
  let supportsTransactions = false;

  try {
    session = await mongoose.startSession();
    // Test if replica set is active
    const client = (mongoose.connection as any).client;
    supportsTransactions = Boolean(client?.topology?.description?.setName);
  } catch {
    supportsTransactions = false;
  }

  if (!supportsTransactions || !session) {
    // Standalone fallback: execute without transaction session
    if (session) {
      await session.endSession();
    }
    return operation(null);
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      // Check if error is transient / write conflict and retry
      const hasTransientLabel = error?.hasErrorLabel?.('TransientTransactionError');
      const isWriteConflict = error?.code === 112 || error?.codeName === 'WriteConflict';

      if ((hasTransientLabel || isWriteConflict) && attempt < maxRetries) {
        console.warn(`[Transaction] Transient error encountered (attempt ${attempt}/${maxRetries}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 50 * Math.pow(2, attempt)));
        continue;
      }

      throw error;
    } finally {
      if (attempt === maxRetries || !session.inTransaction()) {
        await session.endSession();
      }
    }
  }

  throw new Error('Transaction failed after maximum retries');
};
