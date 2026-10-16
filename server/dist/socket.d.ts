import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export declare const initSocket: (httpServer: HttpServer) => SocketIOServer;
export declare const getIO: () => SocketIOServer | null;
export declare const emitToAdmin: (event: string, data: any) => void;
export declare const emitToGuest: (bookingReference: string, event: string, data: any) => void;
export declare const emitBroadcast: (event: string, data: any) => void;
