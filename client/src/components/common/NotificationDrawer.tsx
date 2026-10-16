import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Clock,
  CalendarDays,
  DoorOpen,
  LogOut,
  CheckCircle2,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { playNotificationChime } from '@/services/socket';
import { Button } from './Button';

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isOpen,
    closeDrawer,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'EXTRA_STAY_REQUEST':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'NEW_BOOKING':
        return <CalendarDays className="w-4 h-4 text-gold-500" />;
      case 'CHECK_IN':
        return <DoorOpen className="w-4 h-4 text-emerald-500" />;
      case 'CHECK_OUT':
        return <LogOut className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-sky-400" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    closeDrawer();
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-[#487FFF]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>PMS Live Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Real-time WebSocket connection active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => playNotificationChime()}
              title="Test audio chime"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#487FFF] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between text-xs">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-slate-600 dark:text-slate-400 hover:text-[#487FFF] dark:hover:text-[#487FFF] disabled:opacity-40 font-medium flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Mark all read</span>
          </button>
          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="text-slate-400 hover:text-rose-500 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear list</span>
          </button>
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#487FFF]" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No notifications yet.</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Real-time booking events and extra stay requests will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 flex gap-3 cursor-pointer transition-colors ${
                  !notif.read
                    ? 'bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/80 dark:hover:bg-blue-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 h-fit">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      {formatTimeAgo(notif.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 text-[10px]">
                    <span className="font-semibold text-[#487FFF] hover:underline flex items-center gap-1">
                      View details →
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Grand OMR PMS Realtime
          </span>
          <Button variant="ghost" size="sm" onClick={closeDrawer}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
