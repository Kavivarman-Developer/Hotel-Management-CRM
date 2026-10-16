import mongoose from 'mongoose';
import { env } from '../config/env';

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.collection('guestregistrations');
  try {
    await collection.dropIndex('bookingId_1');
    console.log('Successfully dropped old bookingId_1 index');
  } catch (err: any) {
    console.log('Drop index error or already dropped:', err.message);
  }

  try {
    await collection.createIndex(
      { bookingId: 1 },
      {
        unique: true,
        partialFilterExpression: { bookingId: { $type: 'objectId' } },
        name: 'bookingId_1_partial_unique',
      }
    );
    console.log('Successfully created partial unique index on bookingId');
  } catch (err: any) {
    console.error('Create index error:', err);
  }

  const indexes = await collection.indexes();
  console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
  console.log('Disconnected');
}

run();
