"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearTestDatabase = exports.teardownTestDatabase = exports.setupTestDatabase = void 0;
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
let mongoServer = null;
const setupTestDatabase = async () => {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose_1.default.connect(uri);
    return uri;
};
exports.setupTestDatabase = setupTestDatabase;
const teardownTestDatabase = async () => {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
};
exports.teardownTestDatabase = teardownTestDatabase;
const clearTestDatabase = async () => {
    if (mongoose_1.default.connection.readyState !== 0) {
        const collections = mongoose_1.default.connection.collections;
        for (const key of Object.keys(collections)) {
            await collections[key].deleteMany({});
        }
    }
};
exports.clearTestDatabase = clearTestDatabase;
//# sourceMappingURL=setup.js.map