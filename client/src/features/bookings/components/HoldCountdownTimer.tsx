import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface HoldCountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const HoldCountdownTimer: React.FC<HoldCountdownTimerProps> = ({
  expiresAt,
  onExpire,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const rem = Math.max(0, Math.floor(diff / 1000));
      setSecondsRemaining(rem);

      if (rem <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = secondsRemaining < 180; // under 3 mins

  if (secondsRemaining <= 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-300 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Room hold has expired. Inventory released. Please refresh your search.</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md transition-colors ${
        isUrgent
          ? 'bg-rose-950/60 border-rose-600/60 text-rose-200 animate-pulse'
          : 'bg-gold-500/10 border-gold-500/30 text-gold-300'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Clock className="w-4 h-4 text-gold-400" />
        <div>
          <span className="text-xs font-semibold block">Room Held Exclusively For You</span>
          <span className="text-[11px] text-stone-400">
            Locked from other guests while you complete checkout
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="font-mono text-base font-bold text-stone-100 tracking-wider">
          {formattedTime}
        </span>
      </div>
    </div>
  );
};
