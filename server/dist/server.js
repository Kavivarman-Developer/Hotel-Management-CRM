"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
let server = null;
const startServer = async () => {
    try {
        // 1. Connect to Database
        await (0, database_1.connectDatabase)();
        // Seed promotional vouchers if none exist
        try {
            const { VoucherService } = await Promise.resolve().then(() => __importStar(require('./services/voucher.service')));
            await VoucherService.seedDefaultVouchers();
        }
        catch (e) {
            console.warn('Voucher seed warning:', e.message);
        }
        // 2. Start HTTP Listener with Socket.IO
        server = http_1.default.createServer(app_1.app);
        const { initSocket } = await Promise.resolve().then(() => __importStar(require('./socket')));
        initSocket(server);
        server.listen(env_1.env.PORT, () => {
            console.log(`=======================================================`);
            console.log(`GRAND OMR RESIDENCY — Property Management Backend`);
            console.log(`Environment: ${env_1.env.NODE_ENV}`);
            console.log(`Server running at http://localhost:${env_1.env.PORT}`);
            console.log(`Real-Time WebSockets: Active (Socket.IO)`);
            console.log(`API Documentation: http://localhost:${env_1.env.PORT}/api/docs`);
            console.log(`Health Check: http://localhost:${env_1.env.PORT}/api/health`);
            console.log(`=======================================================`);
        });
    }
    catch (error) {
        console.error('Fatal error during application startup:', error.message);
        process.exit(1);
    }
};
const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
    if (server) {
        server.close(async () => {
            console.log('[Server] HTTP listener closed');
            try {
                await (0, database_1.disconnectDatabase)();
                console.log('[Server] Graceful shutdown completed cleanly');
                process.exit(0);
            }
            catch (err) {
                console.error('[Server] Error during disconnect:', err.message);
                process.exit(1);
            }
        });
    }
    else {
        process.exit(0);
    }
    // Force close after 10s if dangling connections persist
    setTimeout(() => {
        console.error('[Server] Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
    console.error('[Process] Unhandled Promise Rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
    console.error('[Process] Uncaught Exception:', err.message);
    gracefulShutdown('uncaughtException');
});
startServer();
//# sourceMappingURL=server.js.map