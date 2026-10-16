import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

let server: http.Server | null = null;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // Seed promotional vouchers if none exist
    try {
      const { VoucherService } = await import('./services/voucher.service');
      await VoucherService.seedDefaultVouchers();
    } catch (e: any) {
      console.warn('Voucher seed warning:', e.message);
    }

    // 2. Start HTTP Listener with Socket.IO
    server = http.createServer(app);
    const { initSocket } = await import('./socket');
    initSocket(server);

    server.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`GRAND OMR RESIDENCY — Property Management Backend`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Server running at http://localhost:${env.PORT}`);
      console.log(`Real-Time WebSockets: Active (Socket.IO)`);
      console.log(`API Documentation: http://localhost:${env.PORT}/api/docs`);
      console.log(`Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (error: any) {
    console.error('Fatal error during application startup:', error.message);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP listener closed');
      try {
        await disconnectDatabase();
        console.log('[Server] Graceful shutdown completed cleanly');
        process.exit(0);
      } catch (err: any) {
        console.error('[Server] Error during disconnect:', err.message);
        process.exit(1);
      }
    });
  } else {
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

process.on('unhandledRejection', (reason: any) => {
  console.error('[Process] Unhandled Promise Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Process] Uncaught Exception:', err.message);
  gracefulShutdown('uncaughtException');
});

startServer();
