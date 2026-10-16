import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const playNotificationChime = (): void => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Play tone 1 (A5: 880 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Play tone 2 (E6: 1318 Hz) after 120ms
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318, ctx.currentTime);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      } catch {
        // ignore audio failure
      }
    }, 120);
  } catch {
    // Audio context may be restricted by browser policy before first interaction
  }
};

export const getSocket = (): Socket => {
  if (!socket) {
    const rawApi =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      'https://hotel-backend-0x3t.onrender.com/api';

    const serverUrl = rawApi.replace(/\/api\/?$/, '');

    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      socket?.emit('join_admin');
    });
  }

  return socket;
};

export const joinBookingRoom = (bookingReference: string): void => {
  const s = getSocket();
  if (s && bookingReference) {
    s.emit('join_booking', bookingReference);
  }
};
