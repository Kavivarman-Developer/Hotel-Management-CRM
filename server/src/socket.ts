import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from './config/env';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  const allowedOrigins = env.CLIENT_URL.split(',').map((url) => url.trim());

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || true) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    // Staff/Admin room
    socket.on('join_admin', () => {
      socket.join('admin-room');
    });

    // Guest booking specific room
    socket.on('join_booking', (bookingReference: string) => {
      if (bookingReference) {
        socket.join(`booking_${bookingReference.toUpperCase()}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

export const emitToAdmin = (event: string, data: any): void => {
  if (io) {
    io.to('admin-room').emit(event, data);
    // Also broadcast so any listening client receives it
    io.emit(event, data);
  }
};

export const emitToGuest = (bookingReference: string, event: string, data: any): void => {
  if (io && bookingReference) {
    io.to(`booking_${bookingReference.toUpperCase()}`).emit(event, data);
  }
};

export const emitBroadcast = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
  }
};
