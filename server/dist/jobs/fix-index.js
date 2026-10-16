"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
async function run() {
    await mongoose_1.default.connect(env_1.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const collection = mongoose_1.default.connection.collection('guestregistrations');
    try {
        await collection.dropIndex('bookingId_1');
        console.log('Successfully dropped old bookingId_1 index');
    }
    catch (err) {
        console.log('Drop index error or already dropped:', err.message);
    }
    try {
        await collection.createIndex({ bookingId: 1 }, {
            unique: true,
            partialFilterExpression: { bookingId: { $type: 'objectId' } },
            name: 'bookingId_1_partial_unique',
        });
        console.log('Successfully created partial unique index on bookingId');
    }
    catch (err) {
        console.error('Create index error:', err);
    }
    const indexes = await collection.indexes();
    console.log('Current Indexes:', JSON.stringify(indexes, null, 2));
    await mongoose_1.default.disconnect();
    console.log('Disconnected');
}
run();
//# sourceMappingURL=fix-index.js.map