import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  BedDouble,
  User,
  CheckCircle2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Plus,
  DoorOpen,
  CalendarDays,
  Search,
  KeyRound,
  FileText,
  CreditCard,
  Phone,
} from 'lucide-react';
import {
  useGetStaysQuery,
  useGetArrivalsQuery,
  useCheckInStayMutation,
  useCheckOutStayMutation,
  useAddStayChargeMutation,
} from '../staysApi';
import { useGetAdminRoomsQuery } from '@/features/admin/dashboardApi';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { NewBookingModal } from '@/components/common/NewBookingModal';
import { formatCurrency, rupeesToPaise } from '@/utils/formatters';
import { formatDisplayDate } from '@/utils/dates';

type StayTab = 'ARRIVALS' | 'CHECKED_IN' | 'CHECKED_OUT' | 'ALL';

export const StaysManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StayTab>('ARRIVALS');
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const {
    data: staysResponse,
    isLoading: isStaysLoading,
    isError: isStaysError,
    refetch: refetchStays,
  } = useGetStaysQuery(
    { status: activeTab === 'ARRIVALS' ? undefined : activeTab },
    { pollingInterval: 15000 }
  );

  const {
    data: arrivalsResponse,
    isLoading: isArrivalsLoading,
    refetch: refetchArrivals,
  } = useGetArrivalsQuery(undefined, { pollingInterval: 15000 });

  const { data: roomsResponse } = useGetAdminRoomsQuery({ status: 'ACTIVE' });

  // Mutations
  const [checkInStay, { isLoading: isCheckInLoading }] = useCheckInStayMutation();
  const [checkOutStay, { isLoading: isCheckOutLoading }] = useCheckOutStayMutation();
  const [addStayCharge, { isLoading: isAddingCharge }] = useAddStayChargeMutation();

  // Modals state
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);

  // Check-In Modal state
  const [checkInTarget, setCheckInTarget] = useState<any | null>(null);
  const [checkInRoomId, setCheckInRoomId] = useState('');
  const [depositCollectedRupees, setDepositCollectedRupees] = useState(1000);
  const [keyCardNumber, setKeyCardNumber] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');

  // Check-Out Modal state
  const [checkOutModalStay, setCheckOutModalStay] = useState<any | null>(null);
  const [minibarChargesRupees, setMinibarChargesRupees] = useState(0);
  const [damageChargesRupees, setDamageChargesRupees] = useState(0);
  const [lateFeeRupees, setLateFeeRupees] = useState(0);
  const [overstayDetails, setOverstayDetails] = useState<{
    hasOverstay: boolean;
    hours: number;
    feeRupees: number;
    text: string;
  } | null>(null);

  // Add Charge / Extra Stay modal
  const [chargeModalStay, setChargeModalStay] = useState<any | null>(null);
  const [chargeDescription, setChargeDescription] = useState('Late Check-Out / Extra 2 Hours Extension');
  const [chargeAmountRupees, setChargeAmountRupees] = useState(400);
  const [chargeCategory, setChargeCategory] = useState<'OVERSTAY' | 'MINI_BAR' | 'ROOM_SERVICE' | 'DAMAGE' | 'OTHER'>('OVERSTAY');

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const stays = staysResponse?.data || [];
  const arrivals = arrivalsResponse?.data || [];
  const rooms = roomsResponse?.data || [];
  const counts = (staysResponse as any)?.pagination?.counts || {
    arrivals: arrivals.length,
    inHouse: stays.filter((s: any) => s.stayStatus === 'ACTIVE').length,
    departed: stays.filter((s: any) => s.stayStatus === 'COMPLETED').length,
  };

  const handleRefreshAll = () => {
    refetchStays();
    refetchArrivals();
  };

  // Open Check-In Modal
  const handleOpenCheckIn = (bookingOrStay: any) => {
    setCheckInTarget(bookingOrStay);
    const assignedId =
      typeof bookingOrStay.assignedRoomId === 'object'
        ? bookingOrStay.assignedRoomId?._id
        : bookingOrStay.assignedRoomId || bookingOrStay.roomId?._id;
    setCheckInRoomId(assignedId || '');
    setDepositCollectedRupees(1000);
    setKeyCardNumber(`KEY-${Math.floor(100 + Math.random() * 900)}`);
    setCheckInNotes('Front desk check-in verified with ID & registration form');
  };

  // Execute Check-In
  const handleCompleteCheckIn = async () => {
    if (!checkInTarget) return;
    try {
      const targetId = checkInTarget._id;
      await checkInStay({
        id: targetId,
        body: {
          assignedRoomId: checkInRoomId || undefined,
          depositCollected: rupeesToPaise(depositCollectedRupees),
          notes: `${checkInNotes} | Key: ${keyCardNumber}`,
        },
      }).unwrap();

      setCheckInTarget(null);
      setSuccessToast(`Guest checked in successfully! Key card ${keyCardNumber} issued.`);
      handleRefreshAll();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Check-in failed');
    }
  };

  // Open Check-Out Modal
  const handleOpenCheckOut = (stay: any) => {
    setCheckOutModalStay(stay);
    setMinibarChargesRupees(0);
    setDamageChargesRupees(0);

    // Overstay Calculation based on 11:00 AM cutoff
    const checkOutDateStr = stay.bookingId?.checkOutDate;
    if (checkOutDateStr) {
      const [y, m, d] = checkOutDateStr.split('-').map(Number);
      const scheduledCutoff = new Date(y, m - 1, d, 11, 0, 0);
      const now = new Date();

      if (now > scheduledCutoff) {
        const diffMs = now.getTime() - scheduledCutoff.getTime();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const hourlyRateRupees = 200;
        const calculatedFee = diffHours * hourlyRateRupees;

        setLateFeeRupees(calculatedFee);
        setOverstayDetails({
          hasOverstay: true,
          hours: diffHours,
          feeRupees: calculatedFee,
          text: `Guest is checking out ${diffHours} hour(s) past standard 11:00 AM cutoff. Auto-applied ₹${hourlyRateRupees}/hr overstay fee.`,
        });
      } else {
        setLateFeeRupees(0);
        setOverstayDetails(null);
      }
    } else {
      setLateFeeRupees(0);
      setOverstayDetails(null);
    }
  };

  // Execute Check-Out
  const handleCompleteCheckOut = async () => {
    if (!checkOutModalStay) return;
    try {
      const additionalCharges: Array<{ description: string; amount: number; category: string }> = [];

      if (minibarChargesRupees > 0) {
        additionalCharges.push({
          description: 'Minibar / Dining incidentals at checkout',
          amount: rupeesToPaise(minibarChargesRupees),
          category: 'MINI_BAR',
        });
      }
      if (damageChargesRupees > 0) {
        additionalCharges.push({
          description: 'Room damages / deep cleaning at checkout',
          amount: rupeesToPaise(damageChargesRupees),
          category: 'DAMAGE',
        });
      }
      if (lateFeeRupees > 0) {
        additionalCharges.push({
          description: overstayDetails?.text || 'Late check-out fee',
          amount: rupeesToPaise(lateFeeRupees),
          category: 'OVERSTAY',
        });
      }

      await checkOutStay({
        id: checkOutModalStay._id,
        body: {
          additionalCharges,
          lateCheckoutFee: rupeesToPaise(lateFeeRupees),
          minibarCharges: rupeesToPaise(minibarChargesRupees),
          damageCharges: rupeesToPaise(damageChargesRupees),
          notes: 'Standard folio settlement and room departure recorded',
        },
      }).unwrap();

      setCheckOutModalStay(null);
      setSuccessToast(`Guest check-out completed! Room marked DIRTY for housekeeping.`);
      handleRefreshAll();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Check-out failed');
    }
  };

  // Execute Add Charge / Extra Stay Extension
  const handleAddChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeModalStay) return;
    try {
      await addStayCharge({
        id: chargeModalStay._id,
        body: {
          description: chargeDescription,
          amount: rupeesToPaise(chargeAmountRupees),
          category: chargeCategory,
        },
      }).unwrap();

      setChargeModalStay(null);
      setSuccessToast(`Charge of ₹${chargeAmountRupees} added to stay folio.`);
      handleRefreshAll();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to add charge');
    }
  };

  // Filter items
  const filteredArrivals = arrivals.filter((b: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const guest = typeof b.guestId === 'object' ? b.guestId : null;
    return (
      b.bookingReference?.toLowerCase().includes(term) ||
      guest?.fullName?.toLowerCase().includes(term) ||
      guest?.mobile?.includes(term)
    );
  });

  const filteredStays = stays.filter((s: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const booking = s.bookingId;
    const guest = typeof booking?.guestId === 'object' ? booking?.guestId : null;
    const room = s.roomId;
    return (
      booking?.bookingReference?.toLowerCase().includes(term) ||
      guest?.fullName?.toLowerCase().includes(term) ||
      guest?.mobile?.includes(term) ||
      String(room?.roomNumber)?.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Front Desk Operations"
        title="Stay & Folio Management"
        subtitle="Manage expected arrivals, check-in guests, assign physical keys, handle late checkout extensions, and settle departure folios."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewBookingModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + New Reservation / Walk-In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Modern Segmented Pill Tabs */}
        <div className="flex flex-wrap items-center p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl shadow-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('ARRIVALS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ARRIVALS'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Expected Arrivals</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'ARRIVALS'
                  ? 'bg-white text-[#487FFF]'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {arrivals.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHECKED_IN')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'CHECKED_IN'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>Currently In-House</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'CHECKED_IN'
                  ? 'bg-white text-[#487FFF]'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {counts.inHouse}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHECKED_OUT')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'CHECKED_OUT'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Departed</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'CHECKED_OUT'
                  ? 'bg-white text-[#487FFF]'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {counts.departed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Stays & Folios
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guest, phone, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-[#EAECF0] dark:border-slate-700 text-[#1E293B] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#487FFF] shadow-xs transition-colors"
          />
        </div>
      </div>

      {/* VIEW 1: EXPECTED ARRIVALS (PENDING CHECK-IN) */}
      {activeTab === 'ARRIVALS' && (
        <div>
          {isArrivalsLoading ? (
            <LoadingSpinner size="lg" message="Loading expected arrivals..." />
          ) : filteredArrivals.length === 0 ? (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#EAECF0] dark:border-slate-800 p-12 text-center shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] flex items-center justify-center mx-auto shadow-xs">
                <DoorOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#1E293B] dark:text-white">No Pending Arrivals</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                All confirmed guests for today are checked in, or you can register a walk-in guest right now.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowNewBookingModal(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create New Reservation / Walk-In
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] dark:bg-slate-900/60 border-b border-[#EAECF0] dark:border-slate-800 text-[#94A3B8] dark:text-slate-400 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Booking Ref</th>
                      <th className="py-3.5 px-4">Guest Details</th>
                      <th className="py-3.5 px-4">Room & Type</th>
                      <th className="py-3.5 px-4">Dates</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4 text-right">Desk Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0] dark:divide-slate-800">
                    {filteredArrivals.map((b: any) => {
                      const guest = typeof b.guestId === 'object' ? b.guestId : null;
                      const room = typeof b.assignedRoomId === 'object' ? b.assignedRoomId : null;
                      const roomType = typeof b.roomTypeId === 'object' ? b.roomTypeId : null;
                      const guestInitial = guest?.fullName ? guest.fullName.charAt(0).toUpperCase() : 'G';

                      return (
                        <tr key={b._id} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#487FFF]">
                            {b.bookingReference}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] font-bold text-xs flex items-center justify-center border border-blue-100 dark:border-blue-900">
                                {guestInitial}
                              </div>
                              <div>
                                <div className="font-bold text-[#1E293B] dark:text-white">
                                  {guest?.fullName || 'Guest'}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{guest?.mobile || 'No Phone'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1E293B] dark:text-white">
                              {room ? `Room ${room.roomNumber}` : 'Unassigned'}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              {roomType?.name || 'Deluxe Room'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#1E293B] dark:text-slate-200">
                              {formatDisplayDate(b.checkInDate)}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              to {formatDisplayDate(b.checkOutDate)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#1E293B] dark:text-white font-mono text-sm">
                            {formatCurrency(b.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={b.paymentStatus} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenCheckIn(b)}
                              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                            >
                              Check-In Guest
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2, 3, 4: STAYS TABLE (IN-HOUSE, DEPARTED, ALL) */}
      {activeTab !== 'ARRIVALS' && (
        <div>
          {isStaysLoading ? (
            <LoadingSpinner size="lg" message="Loading stay records..." />
          ) : isStaysError ? (
            <ErrorMessage
              title="Error loading stays"
              message="Failed to retrieve stay records from the PMS."
              onRetry={handleRefreshAll}
            />
          ) : filteredStays.length === 0 ? (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#EAECF0] dark:border-slate-800 p-12 text-center shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-3">
              <p className="font-bold text-base text-[#1E293B] dark:text-white">No stay records found for this filter.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check the "Expected Arrivals" tab to check in arriving guests.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('ARRIVALS')}
                  leftIcon={<DoorOpen className="w-4 h-4" />}
                >
                  Go to Expected Arrivals ({arrivals.length})
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] dark:bg-slate-900/60 border-b border-[#EAECF0] dark:border-slate-800 text-[#94A3B8] dark:text-slate-400 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Booking Ref</th>
                      <th className="py-3.5 px-4">Guest</th>
                      <th className="py-3.5 px-4">Assigned Room</th>
                      <th className="py-3.5 px-4">Check-In Time</th>
                      <th className="py-3.5 px-4">Departure Time</th>
                      <th className="py-3.5 px-4">Stay Status</th>
                      <th className="py-3.5 px-4 text-right">Desk Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0] dark:divide-slate-800">
                    {filteredStays.map((s: any) => {
                      const booking = s.bookingId;
                      const guest = typeof booking?.guestId === 'object' ? booking?.guestId : null;
                      const room = s.roomId;
                      const isInHouse = s.stayStatus === 'ACTIVE';

                      return (
                        <tr key={s._id} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#487FFF]">
                            {booking?.bookingReference || s.bookingReference || 'GOR-REF'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1E293B] dark:text-white">
                              {guest?.fullName || 'Guest'}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              {guest?.mobile || ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] font-bold font-mono border border-blue-100 dark:border-blue-900">
                              {room?.roomNumber ? `Room ${room.roomNumber}` : 'Unassigned'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {s.actualCheckInTimestamp
                              ? new Date(s.actualCheckInTimestamp).toLocaleString('en-IN', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : 'Pending'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {s.actualCheckOutTimestamp ? (
                              new Date(s.actualCheckOutTimestamp).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            ) : (
                              <span className="text-[#10B981] font-semibold">
                                Scheduled: {booking?.checkOutDate ? formatDisplayDate(booking.checkOutDate) : 'Today'} 11:00 AM
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge
                              status={isInHouse ? 'CHECKED_IN' : 'CHECKED_OUT'}
                              size="sm"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isInHouse ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setChargeModalStay(s);
                                      setChargeDescription('Late Check-Out / Extra 2 Hours Extension');
                                      setChargeAmountRupees(400);
                                      setChargeCategory('OVERSTAY');
                                    }}
                                    leftIcon={<Clock className="w-3.5 h-3.5 text-[#FF9F43]" />}
                                  >
                                    Extend Stay
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleOpenCheckOut(s)}
                                    leftIcon={<LogOut className="w-3.5 h-3.5" />}
                                  >
                                    Check-Out
                                  </Button>
                                </>
                              ) : (
                                <span className="font-mono text-[11px] text-slate-400">
                                  {s.finalBillReference || 'Folio Settled'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHECK-IN MODAL */}
      {checkInTarget && (
        <Modal
          isOpen={Boolean(checkInTarget)}
          onClose={() => setCheckInTarget(null)}
          title={`Front Desk Check-In: ${checkInTarget.bookingReference}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Guest Name:</span>
                <span className="font-bold text-[#1E293B] dark:text-white">
                  {typeof checkInTarget.guestId === 'object'
                    ? checkInTarget.guestId?.fullName
                    : 'Guest'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Mobile:</span>
                <span className="font-semibold text-[#1E293B] dark:text-slate-200">
                  {typeof checkInTarget.guestId === 'object'
                    ? checkInTarget.guestId?.mobile
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Stay Duration:</span>
                <span className="font-semibold text-[#1E293B] dark:text-slate-200">
                  {formatDisplayDate(checkInTarget.checkInDate)} to{' '}
                  {formatDisplayDate(checkInTarget.checkOutDate)}
                </span>
              </div>
            </div>

            {/* Room Assignment */}
            <div>
              <label className="block text-xs font-bold text-[#1E293B] dark:text-white mb-1.5">
                Assign / Verify Physical Room *
              </label>
              <select
                value={checkInRoomId}
                onChange={(e) => setCheckInRoomId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#EAECF0] dark:border-slate-700 text-xs font-semibold text-[#1E293B] dark:text-white outline-none focus:border-[#487FFF]"
              >
                <option value="">-- Select Room --</option>
                {rooms.map((r: any) => (
                  <option key={r._id} value={r._id}>
                    Room {r.roomNumber} (Floor {r.floor || 1}) [{r.housekeepingStatus}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Physical Key Card Number"
                placeholder="e.g. KEY-102"
                value={keyCardNumber}
                onChange={(e) => setKeyCardNumber(e.target.value)}
              />
              <Input
                label="Security Deposit Collected (₹)"
                type="number"
                min="0"
                value={depositCollectedRupees}
                onChange={(e) => setDepositCollectedRupees(Number(e.target.value))}
              />
            </div>

            <Input
              label="Front Desk Check-in Notes"
              placeholder="Identity verified with Aadhaar / Passport"
              value={checkInNotes}
              onChange={(e) => setCheckInNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setCheckInTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isCheckInLoading}
                onClick={handleCompleteCheckIn}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete Check-In & Issue Key
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CHECK-OUT MODAL */}
      {checkOutModalStay && (
        <Modal
          isOpen={Boolean(checkOutModalStay)}
          onClose={() => setCheckOutModalStay(null)}
          title="Process Guest Check-Out & Bill Settlement"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Confirm departure and log any incidental or overstay fees before releasing the
              room for housekeeping.
            </p>

            {/* Overstay Alert Banner */}
            {overstayDetails?.hasOverstay && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#FF9F43]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Automated Overstay Fee Calculated</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{overstayDetails.text}</p>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200 dark:border-amber-800 text-[11px]">
                  <span className="font-medium">Auto-Calculated Late Checkout Fee:</span>
                  <span className="font-bold text-[#FF9F43]">
                    ₹{overstayDetails.feeRupees}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Minibar / In-Room Dining (₹)"
                type="number"
                min="0"
                value={minibarChargesRupees}
                onChange={(e) => setMinibarChargesRupees(Number(e.target.value))}
              />
              <Input
                label="Damage / Repair Charges (₹)"
                type="number"
                min="0"
                value={damageChargesRupees}
                onChange={(e) => setDamageChargesRupees(Number(e.target.value))}
              />
              <Input
                label="Late Checkout / Overstay Fee (₹)"
                type="number"
                min="0"
                value={lateFeeRupees}
                onChange={(e) => setLateFeeRupees(Number(e.target.value))}
              />
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-700 space-y-1">
              <div className="flex justify-between font-bold text-sm text-[#1E293B] dark:text-white">
                <span>Total Incidentals to Settle:</span>
                <span className="text-[#487FFF]">
                  ₹{minibarChargesRupees + damageChargesRupees + lateFeeRupees}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Completing check-out automatically transitions room status to "DIRTY" for
                housekeeping inspection.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setCheckOutModalStay(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isCheckOutLoading}
                onClick={handleCompleteCheckOut}
              >
                Complete Check-Out & Settle
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* EXTEND STAY / ADD CHARGE MODAL */}
      {chargeModalStay && (
        <Modal
          isOpen={Boolean(chargeModalStay)}
          onClose={() => setChargeModalStay(null)}
          title={`Extend Stay / Add Incidentals: Room ${chargeModalStay.roomId?.roomNumber || ''}`}
        >
          <form onSubmit={handleAddChargeSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Add extra hours, late check-out fees, or incidental services directly to the guest's folio.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] dark:text-white mb-1.5">
                Charge Category
              </label>
              <select
                value={chargeCategory}
                onChange={(e) => setChargeCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#EAECF0] dark:border-slate-700 text-xs font-semibold text-[#1E293B] dark:text-white outline-none focus:border-[#487FFF]"
              >
                <option value="OVERSTAY">Late Check-Out / Extra Stay Extension</option>
                <option value="MINI_BAR">Minibar & Refreshments</option>
                <option value="ROOM_SERVICE">In-Room Dining / Food & Beverage</option>
                <option value="DAMAGE">Damage / Deep Cleaning Fee</option>
                <option value="OTHER">Other Incidental</option>
              </select>
            </div>

            <Input
              label="Description *"
              value={chargeDescription}
              onChange={(e) => setChargeDescription(e.target.value)}
              required
            />

            <Input
              label="Charge Amount (₹) *"
              type="number"
              min="1"
              value={chargeAmountRupees}
              onChange={(e) => setChargeAmountRupees(Number(e.target.value))}
              required
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setChargeModalStay(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isAddingCharge}>
                Add to Stay Folio
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* NEW RESERVATION / WALK-IN MODAL */}
      <NewBookingModal
        isOpen={showNewBookingModal}
        onClose={() => setShowNewBookingModal(false)}
        onSuccess={(msg) => {
          setSuccessToast(msg);
          handleRefreshAll();
        }}
      />
    </div>
  );
};
