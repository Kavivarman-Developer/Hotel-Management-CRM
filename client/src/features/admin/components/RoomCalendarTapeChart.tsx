import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  BedDouble,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
  DoorOpen,
} from 'lucide-react';
import {
  useGetAdminRoomsQuery,
  useGetAdminBookingsQuery,
} from '../dashboardApi';
import { useCheckInStayMutation } from '@/features/stays/staysApi';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { NewBookingModal } from '@/components/common/NewBookingModal';
import { Room, Booking } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { getDefaultCheckIn, addDays, calculateNights, formatDisplayDate } from '@/utils/dates';

// Generate array of date objects starting from a base date
const generateDateRange = (startDateStr: string, totalDays: number) => {
  const dates: { dateStr: string; dayName: string; dayNum: number; monthName: string; isToday: boolean }[] = [];
  const todayStr = getDefaultCheckIn();

  const start = new Date(startDateStr);
  // Ensure valid date
  const base = isNaN(start.getTime()) ? new Date() : start;

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(base);
    current.setDate(base.getDate() + i);
    const dateStr = current.toISOString().slice(0, 10);

    const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = current.getDate();
    const monthName = current.toLocaleDateString('en-US', { month: 'short' });

    dates.push({
      dateStr,
      dayName,
      dayNum,
      monthName,
      isToday: dateStr === todayStr,
    });
  }

  return dates;
};

export const RoomCalendarTapeChart: React.FC = () => {
  const navigate = useNavigate();

  // Calendar Timeline Window State
  const [startDateStr, setStartDateStr] = useState<string>(() => getDefaultCheckIn());
  const [viewSpanDays, setViewSpanDays] = useState<number>(10); // 7, 10, 14, 21, 30 days
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Booking for Details Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Quick Booking from Calendar Slot
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [bookingSlotRoomId, setBookingSlotRoomId] = useState<string | undefined>(undefined);
  const [bookingSlotCheckIn, setBookingSlotCheckIn] = useState<string | undefined>(undefined);
  const [bookingSlotCheckOut, setBookingSlotCheckOut] = useState<string | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries
  const {
    data: roomsRes,
    isLoading: isRoomsLoading,
    refetch: refetchRooms,
  } = useGetAdminRoomsQuery({ status: 'ACTIVE' }, { pollingInterval: 15000 });

  const {
    data: bookingsRes,
    isLoading: isBookingsLoading,
    refetch: refetchBookings,
  } = useGetAdminBookingsQuery({ limit: 200 }, { pollingInterval: 15000 });

  const [checkInStay, { isLoading: isCheckingIn }] = useCheckInStayMutation();

  const rooms: Room[] = roomsRes?.data || [];
  const bookings: Booking[] = bookingsRes?.data || [];

  // Generate Date Range Array
  const dateRange = useMemo(
    () => generateDateRange(startDateStr, viewSpanDays),
    [startDateStr, viewSpanDays]
  );

  // Distinct room types for filter
  const roomTypesList = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach((r) => {
      const name = typeof r.roomTypeId === 'object' ? (r.roomTypeId as any)?.name : null;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [rooms]);

  // Distinct floors for filter
  const floorsList = useMemo(() => {
    const set = new Set<number>();
    rooms.forEach((r) => {
      if (r.floor !== undefined) set.add(r.floor);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms]);

  // Filtered Rooms List
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const typeName =
        typeof room.roomTypeId === 'object'
          ? (room.roomTypeId as any)?.name || ''
          : '';

      if (selectedRoomType !== 'ALL' && typeName !== selectedRoomType) {
        return false;
      }

      if (selectedFloor !== 'ALL' && String(room.floor) !== selectedFloor) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRoom = room.roomNumber.toLowerCase().includes(q);
        const matchesType = typeName.toLowerCase().includes(q);
        if (!matchesRoom && !matchesType) return false;
      }

      return true;
    });
  }, [rooms, selectedRoomType, selectedFloor, searchQuery]);

  // Map each room and date to its active booking (if any)
  const roomDateBookingMap = useMemo(() => {
    const map = new Map<string, Booking>();

    // Active non-cancelled bookings
    const activeBookings = bookings.filter(
      (b) => b.reservationStatus !== 'CANCELLED'
    );

    // Keep track of room allocations for bookings that might not have assignedRoomId yet
    const unassignedByType = new Map<string, Booking[]>();

    activeBookings.forEach((b) => {
      const checkIn = b.checkInDate ? b.checkInDate.slice(0, 10) : '';
      const checkOut = b.checkOutDate ? b.checkOutDate.slice(0, 10) : '';
      if (!checkIn || !checkOut) return;

      const assignedId =
        typeof b.assignedRoomId === 'object'
          ? (b.assignedRoomId as any)?._id
          : b.assignedRoomId;

      if (assignedId) {
        // Tag every day the guest occupies the room (nights of stay)
        dateRange.forEach((d) => {
          if (d.dateStr >= checkIn && (d.dateStr < checkOut || checkIn === checkOut)) {
            map.set(`${assignedId}_${d.dateStr}`, b);
          }
        });
      } else {
        // Unassigned room booking
        const typeId =
          typeof b.roomTypeId === 'object'
            ? (b.roomTypeId as any)?._id
            : b.roomTypeId;
        if (typeId) {
          const list = unassignedByType.get(typeId) || [];
          list.push(b);
          unassignedByType.set(typeId, list);
        }
      }
    });

    // Auto-allocate unassigned bookings to free rooms of the same type for visibility
    unassignedByType.forEach((unassignedList, typeId) => {
      unassignedList.forEach((b) => {
        const checkIn = b.checkInDate.slice(0, 10);
        const checkOut = b.checkOutDate.slice(0, 10);

        // Find a room of this type that is free across these dates
        const candidateRoom = rooms.find((r) => {
          const rTypeId = typeof r.roomTypeId === 'object' ? (r.roomTypeId as any)?._id : r.roomTypeId;
          if (rTypeId !== typeId) return false;

          // Check if any date in the booking overlaps
          for (const d of dateRange) {
            if (d.dateStr >= checkIn && (d.dateStr < checkOut || checkIn === checkOut)) {
              if (map.has(`${r._id}_${d.dateStr}`)) return false;
            }
          }
          return true;
        });

        if (candidateRoom) {
          dateRange.forEach((d) => {
            if (d.dateStr >= checkIn && (d.dateStr < checkOut || checkIn === checkOut)) {
              map.set(`${candidateRoom._id}_${d.dateStr}`, b);
            }
          });
        }
      });
    });

    // Also support current in-house booking directly from Room document
    rooms.forEach((r) => {
      if (r.isOccupied && r.currentBooking) {
        const todayStr = getDefaultCheckIn();
        const checkIn = r.currentBooking.checkInDate ? r.currentBooking.checkInDate.slice(0, 10) : todayStr;
        const checkOut = r.currentBooking.checkOutDate ? r.currentBooking.checkOutDate.slice(0, 10) : addDays(todayStr, 1);

        const syntheticBooking: any = {
          _id: `current_${r._id}`,
          bookingReference: r.currentBooking.bookingReference || 'GOR-INHOUSE',
          guestId: {
            fullName: r.currentBooking.guestName || 'In-House Guest',
            email: 'guest@hotel.com',
            mobile: '+91 98401 23456',
          },
          assignedRoomId: r,
          roomTypeId: r.roomTypeId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          reservationStatus: 'CONFIRMED',
          stayStatus: 'CHECKED_IN',
          paymentStatus: 'PAID',
          totalAmount: 350000,
          source: 'DIRECT',
        };

        dateRange.forEach((d) => {
          if (d.dateStr >= checkIn && (d.dateStr < checkOut || checkIn === checkOut)) {
            if (!map.has(`${r._id}_${d.dateStr}`)) {
              map.set(`${r._id}_${d.dateStr}`, syntheticBooking);
            }
          }
        });
      }
    });

    return map;
  }, [bookings, rooms, dateRange]);

  // Overall Occupancy Metrics for the Visible Window
  const timelineStats = useMemo(() => {
    let totalSlots = filteredRooms.length * dateRange.length;
    let bookedSlots = 0;

    filteredRooms.forEach((r) => {
      dateRange.forEach((d) => {
        if (roomDateBookingMap.has(`${r._id}_${d.dateStr}`)) {
          bookedSlots++;
        }
      });
    });

    const vacantSlots = Math.max(0, totalSlots - bookedSlots);
    const occupancyPercentage = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    return { totalSlots, bookedSlots, vacantSlots, occupancyPercentage };
  }, [filteredRooms, dateRange, roomDateBookingMap]);

  // Navigation handlers
  const handleShiftDays = (amount: number) => {
    const cur = new Date(startDateStr);
    cur.setDate(cur.getDate() + amount);
    setStartDateStr(cur.toISOString().slice(0, 10));
  };

  const handleJumpToToday = () => {
    setStartDateStr(getDefaultCheckIn());
  };

  // Open booking modal for a specific room and date
  const handleSlotClick = (room: Room, dateStr: string) => {
    setBookingSlotRoomId(room._id);
    setBookingSlotCheckIn(dateStr);
    setBookingSlotCheckOut(addDays(dateStr, 1));
    setIsNewBookingModalOpen(true);
  };

  // Check in handler for quick modal
  const handleQuickCheckIn = async (bookingId: string) => {
    try {
      await checkInStay({ id: bookingId, body: {} }).unwrap();
      setToastMessage('Guest check-in registered & room key active.');
      setSelectedBooking(null);
      refetchBookings();
      refetchRooms();
    } catch (err: any) {
      alert(err?.data?.error?.message || err?.data?.message || 'Check-in failed');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* Top Header / Timeline Navigator Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-[#487FFF]">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-[#1E293B] dark:text-white">
                Date-Wise Room Booking Calendar (Tape Chart)
              </h2>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
              Monitor room occupancy day by day, view instant reservation statuses, or click any vacant date slot to book directly.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchRooms();
                refetchBookings();
              }}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setBookingSlotRoomId(undefined);
                setBookingSlotCheckIn(undefined);
                setBookingSlotCheckOut(undefined);
                setIsNewBookingModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Reservation
            </Button>
          </div>
        </div>

        {/* Date Timeline Control Ribbon */}
        <div className="pt-3 border-t border-[#EAECF0] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Timeline Step Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShiftDays(-viewSpanDays)}
              className="p-2 rounded-xl border border-[#EAECF0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title={`Previous ${viewSpanDays} Days`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-xl border border-[#487FFF] text-[#487FFF] bg-blue-50/50 dark:bg-blue-950/30 text-xs font-bold hover:bg-[#487FFF] hover:text-white transition-all shadow-xs"
            >
              Today
            </button>
            <button
              onClick={() => handleShiftDays(viewSpanDays)}
              className="p-2 rounded-xl border border-[#EAECF0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title={`Next ${viewSpanDays} Days`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Jump to specific date */}
            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 font-medium">Start Date:</span>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => {
                  if (e.target.value) setStartDateStr(e.target.value);
                }}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-[#487FFF]"
              />
            </div>

            {/* Visible Span Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl ml-2">
              {[
                { label: '7 Days', days: 7 },
                { label: '10 Days', days: 10 },
                { label: '14 Days', days: 14 },
                { label: '1 Month', days: 30 },
              ].map((span) => (
                <button
                  key={span.days}
                  onClick={() => setViewSpanDays(span.days)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    viewSpanDays === span.days
                      ? 'bg-[#487FFF] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {span.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics in this Period */}
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Period Occupancy:</span>
              <span className="font-bold text-[#487FFF] text-sm">
                {timelineStats.occupancyPercentage}%
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Booked Slots:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {timelineStats.bookedSlots}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Vacant Slots:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {timelineStats.vacantSlots}
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Status Legend */}
        <div className="pt-3 border-t border-[#EAECF0] dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Room Type & Floor Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Room Type Select */}
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs focus:ring-1 focus:ring-[#487FFF]"
            >
              <option value="ALL">All Room Types ({rooms.length})</option>
              {roomTypesList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Floor Select */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs focus:ring-1 focus:ring-[#487FFF]"
            >
              <option value="ALL">All Floors</option>
              {floorsList.map((f) => (
                <option key={f} value={String(f)}>
                  Floor {f}
                </option>
              ))}
            </select>

            {/* Search room or type */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Room #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-[#487FFF]"
              />
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#10B981] shadow-xs" />
              <span>In-House (Checked In)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#487FFF] shadow-xs" />
              <span>Confirmed Reservation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#FF9F43] shadow-xs" />
              <span>Extra Stay Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 border-dashed" />
              <span>Vacant (Click to Book)</span>
            </div>
          </div>
        </div>
      </div>

      {/* The Reservation Tape Chart Grid */}
      <div className="rounded-2xl border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-[0_2px_6px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse text-left text-xs">
            {/* Date Headers */}
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-[#EAECF0] dark:border-slate-800">
                {/* Sticky Left Room Header */}
                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 p-3.5 min-w-[210px] max-w-[210px] border-r border-[#EAECF0] dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>Room Inventory</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {filteredRooms.length} Rooms
                    </span>
                  </div>
                </th>

                {/* Day Columns */}
                {dateRange.map((d) => {
                  return (
                    <th
                      key={d.dateStr}
                      className={`p-2.5 text-center min-w-[110px] max-w-[120px] border-r border-[#EAECF0] dark:border-slate-800 transition-colors ${
                        d.isToday
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 text-[#487FFF]'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                        {d.dayName}
                      </div>
                      <div className="text-base font-extrabold flex items-center justify-center gap-1 mt-0.5">
                        <span>{d.dayNum}</span>
                        <span className="text-[11px] font-semibold opacity-80">{d.monthName}</span>
                      </div>
                      {d.isToday && (
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#487FFF] text-white">
                            TODAY
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Room Rows */}
            <tbody className="divide-y divide-[#EAECF0] dark:divide-slate-800">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={dateRange.length + 1}
                    className="p-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    No rooms match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const roomTypeName =
                    typeof room.roomTypeId === 'object'
                      ? (room.roomTypeId as any)?.name || 'Deluxe Room'
                      : 'Deluxe Room';
                  const baseNightRate =
                    typeof room.roomTypeId === 'object'
                      ? (room.roomTypeId as any)?.baseRate || 250000
                      : 250000;

                  return (
                    <tr
                      key={room._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      {/* Sticky Left Room Details Cell */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-[#1E293B] p-3 min-w-[210px] max-w-[210px] border-r border-[#EAECF0] dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#487FFF] flex items-center justify-center font-bold text-xs">
                              {room.roomNumber}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                                Room {room.roomNumber}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                                {roomTypeName}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                              Floor {room.floor}
                            </span>
                            <span className="text-[10px] font-bold text-[#487FFF]">
                              {formatCurrency(baseNightRate)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Day Slots */}
                      {dateRange.map((d) => {
                        const bookingKey = `${room._id}_${d.dateStr}`;
                        const booking = roomDateBookingMap.get(bookingKey);

                        // If room is under maintenance on this date
                        const isUnderMaintenance =
                          room.status === 'MAINTENANCE' ||
                          (room.maintenanceBlock?.isBlocked &&
                            (!room.maintenanceBlock.blockedFrom || d.dateStr >= room.maintenanceBlock.blockedFrom.slice(0, 10)) &&
                            (!room.maintenanceBlock.blockedUntil || d.dateStr <= room.maintenanceBlock.blockedUntil.slice(0, 10)));

                        if (isUnderMaintenance) {
                          return (
                            <td
                              key={d.dateStr}
                              className="p-1.5 border-r border-[#EAECF0] dark:border-slate-800 text-center bg-rose-50/40 dark:bg-rose-950/20"
                            >
                              <div className="h-12 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-1 flex flex-col items-center justify-center text-[10px] text-rose-600 font-bold">
                                <AlertTriangle className="w-3 h-3 text-rose-500 mb-0.5" />
                                <span>Blocked</span>
                              </div>
                            </td>
                          );
                        }

                        if (booking) {
                          const guestName =
                            typeof booking.guestId === 'object'
                              ? (booking.guestId as any)?.fullName || 'Guest'
                              : 'Booked Guest';

                          const isInHouse = booking.stayStatus === 'CHECKED_IN';
                          const isConfirmed = booking.reservationStatus === 'CONFIRMED';
                          const isCheckInDay = booking.checkInDate && booking.checkInDate.slice(0, 10) === d.dateStr;

                          // Theme styles for booking block
                          const bgClass = isInHouse
                            ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                            : isConfirmed
                            ? 'bg-[#487FFF] text-white hover:bg-[#3867d6]'
                            : 'bg-amber-500 text-white hover:bg-amber-600';

                          return (
                            <td
                              key={d.dateStr}
                              className="p-1 border-r border-[#EAECF0] dark:border-slate-800"
                            >
                              <div
                                onClick={() => setSelectedBooking(booking)}
                                className={`h-12 rounded-xl p-1.5 flex flex-col justify-between cursor-pointer transition-all shadow-xs hover:shadow-md transform hover:-translate-y-0.5 ${bgClass}`}
                                title={`Click to view booking: ${guestName} (${booking.bookingReference})`}
                              >
                                <div className="flex items-center justify-between gap-1 leading-none">
                                  <span className="font-extrabold text-[11px] truncate max-w-[80px]">
                                    {guestName}
                                  </span>
                                  {isCheckInDay && (
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" title="Check-in Day" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[9px] opacity-90 leading-none">
                                  <span className="font-mono truncate">{booking.bookingReference.slice(-6)}</span>
                                  <span className="uppercase font-bold tracking-tight">
                                    {isInHouse ? 'IN-HOUSE' : 'BOOKED'}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        // Free / Vacant Date Slot
                        return (
                          <td
                            key={d.dateStr}
                            className={`p-1 border-r border-[#EAECF0] dark:border-slate-800 transition-colors ${
                              d.isToday ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                            }`}
                          >
                            <div
                              onClick={() => handleSlotClick(room, d.dateStr)}
                              className="h-12 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80 hover:border-[#487FFF] hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-[#487FFF] transition-all group"
                              title={`Room ${room.roomNumber} is Available on ${formatDisplayDate(d.dateStr)}. Click to Book.`}
                            >
                              <span className="text-[10px] font-semibold text-slate-400 group-hover:hidden">
                                Free
                              </span>
                              <div className="hidden group-hover:flex items-center gap-1 text-[11px] font-bold text-[#487FFF]">
                                <Plus className="w-3.5 h-3.5" />
                                <span>Book</span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title="Reservation Details & Guest Stay"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header Highlights */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Booking Reference
                </span>
                <div className="font-mono text-base font-extrabold text-[#487FFF]">
                  {selectedBooking.bookingReference}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedBooking.reservationStatus} size="sm" />
                <StatusBadge status={selectedBooking.stayStatus} size="sm" />
              </div>
            </div>

            {/* Guest Info */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#487FFF]" />
                <span>Guest Information</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {typeof selectedBooking.guestId === 'object'
                      ? (selectedBooking.guestId as any)?.fullName
                      : 'Registered Guest'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone Number</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Phone className="w-3 h-3 text-[#487FFF]" />
                    <span>
                      {typeof selectedBooking.guestId === 'object'
                        ? (selectedBooking.guestId as any)?.mobile
                        : '+91 98401 23456'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Email Address</span>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">
                      {typeof selectedBooking.guestId === 'object'
                        ? (selectedBooking.guestId as any)?.email
                        : 'guest@hotel.com'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nationality</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {typeof selectedBooking.guestId === 'object'
                      ? (selectedBooking.guestId as any)?.nationality || 'Indian'
                      : 'Indian'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stay Dates & Room Details */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-[#487FFF]" />
                <span>Room & Stay Dates</span>
              </h4>
              <div className="grid grid-cols-3 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">Check-In</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatDisplayDate(selectedBooking.checkInDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Check-Out</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatDisplayDate(selectedBooking.checkOutDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Duration</span>
                  <span className="font-bold text-[#487FFF]">
                    {calculateNights(selectedBooking.checkInDate, selectedBooking.checkOutDate)} Nights
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Total Billed Amount:</span>
                <span className="font-bold text-[#487FFF] text-sm">
                  {formatCurrency(selectedBooking.totalAmount)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBooking(null);
                  navigate('/admin/bookings');
                }}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Go to Bookings Management
              </Button>

              <div className="flex items-center gap-2">
                {selectedBooking.stayStatus !== 'CHECKED_IN' &&
                  selectedBooking.reservationStatus !== 'CANCELLED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isCheckingIn}
                      onClick={() => handleQuickCheckIn(selectedBooking._id)}
                      leftIcon={<DoorOpen className="w-3.5 h-3.5" />}
                    >
                      Check-In Guest Now
                    </Button>
                  )}
                <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Booking Modal pre-filled from Calendar Slot */}
      {isNewBookingModalOpen && (
        <NewBookingModal
          isOpen={isNewBookingModalOpen}
          onClose={() => setIsNewBookingModalOpen(false)}
          initialRoomId={bookingSlotRoomId}
          initialCheckInDate={bookingSlotCheckIn}
          initialCheckOutDate={bookingSlotCheckOut}
          onSuccess={(msg) => {
            setToastMessage(msg || 'Room booked successfully from calendar.');
            setIsNewBookingModalOpen(false);
            refetchBookings();
            refetchRooms();
          }}
        />
      )}
    </div>
  );
};
