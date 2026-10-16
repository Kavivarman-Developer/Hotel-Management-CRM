import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSocket, playNotificationChime } from '@/services/socket';

export interface AppNotification {
  id: string;
  type: 'EXTRA_STAY_REQUEST' | 'NEW_BOOKING' | 'CHECK_IN' | 'CHECK_OUT' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'init_1',
    type: 'EXTRA_STAY_REQUEST',
    title: 'Customer Late Check-Out Request',
    message: 'Guest requested +2 hours extra stay extension for Room 102. Ready for review.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
    link: '/admin/extra-stays',
  },
  {
    id: 'init_2',
    type: 'NEW_BOOKING',
    title: 'New Confirmed Reservation',
    message: 'Booking GOR-20261015-3BF0BE confirmed for Deluxe Suite. Check-in scheduled.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
    link: '/admin/bookings',
  },
  {
    id: 'init_3',
    type: 'SYSTEM',
    title: 'Front Desk Daily Audit',
    message: 'Live MongoDB synchronization established. Real-time PMS WebSockets active.',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    read: false,
    link: '/admin/stays',
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('gor_pms_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('gor_pms_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    const socket = getSocket();

    const handleNewRequest = (data: any) => {
      playNotificationChime();
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'EXTRA_STAY_REQUEST',
        title: `Extra Stay Request: Room ${data.roomNumber || 'Guest'}`,
        message: `${data.guestName || 'Guest'} requested +${data.requestedExtraHours || 1} hrs late check-out. Fee: ₹${
          data.chargeAmountRupees || Math.round((data.chargeAmountPaise || 20000) / 100)
        }.`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/admin/extra-stays',
        metadata: data,
      };

      setNotifications((prev) => [newNotif, ...prev]);
    };

    const handleNewBooking = (data: any) => {
      playNotificationChime();
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'NEW_BOOKING',
        title: `New Reservation: ${data.bookingReference || 'GOR'}`,
        message: `${data.guestName || 'Guest'} booked for ${data.dates || 'upcoming stay'}. Total: ₹${Math.round(
          (data.totalAmount || 0) / 100
        )}.`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/admin/bookings',
        metadata: data,
      };

      setNotifications((prev) => [newNotif, ...prev]);
    };

    const handleCheckIn = (data: any) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'CHECK_IN',
        title: `Guest Checked In: Room ${data.roomNumber || ''}`,
        message: `Booking ${data.bookingReference} is now in-house. Key card issued.`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/admin/stays',
        metadata: data,
      };

      setNotifications((prev) => [newNotif, ...prev]);
    };

    const handleCheckOut = (data: any) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'CHECK_OUT',
        title: `Guest Departed: Room ${data.roomNumber || ''}`,
        message: `Booking ${data.bookingReference} checked out. Room flagged DIRTY for housekeeping.`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/admin/stays',
        metadata: data,
      };

      setNotifications((prev) => [newNotif, ...prev]);
    };

    const handleGenericNotification = (data: any) => {
      const newNotif: AppNotification = {
        id: data.id || `notif_${Date.now()}`,
        type: data.type || 'SYSTEM',
        title: data.title || 'PMS Alert',
        message: data.message || '',
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        read: false,
        link: data.link || '/admin/dashboard',
      };

      setNotifications((prev) => [newNotif, ...prev]);
    };

    socket.on('extra_stay:new_request', handleNewRequest);
    socket.on('booking:new', handleNewBooking);
    socket.on('stay:checked_in', handleCheckIn);
    socket.on('stay:checked_out', handleCheckOut);
    socket.on('notification:new', handleGenericNotification);

    return () => {
      socket.off('extra_stay:new_request', handleNewRequest);
      socket.off('booking:new', handleNewBooking);
      socket.off('stay:checked_in', handleCheckIn);
      socket.off('stay:checked_out', handleCheckOut);
      socket.off('notification:new', handleGenericNotification);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        openDrawer: () => setIsOpen(true),
        closeDrawer: () => setIsOpen(false),
        toggleDrawer: () => setIsOpen((prev) => !prev),
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
