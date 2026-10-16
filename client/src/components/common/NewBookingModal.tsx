import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  BedDouble,
  User,
  Phone,
  Mail,
  Tag,
  CheckCircle2,
  AlertTriangle,
  DoorOpen,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { useGetAdminRoomsQuery } from '@/features/admin/dashboardApi';
import { useCreateBookingMutation } from '@/features/bookings/bookingsApi';
import { useCheckInStayMutation } from '@/features/stays/staysApi';
import { useValidateVoucherMutation } from '@/features/vouchers/vouchersApi';
import {
  getDefaultCheckIn,
  getMinCheckOutDate,
  addDays,
  calculateNights,
  formatDisplayDate,
} from '@/utils/dates';
import { formatCurrency, rupeesToPaise } from '@/utils/formatters';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  initialRoomId?: string;
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRoomId,
  initialCheckInDate,
  initialCheckOutDate,
}) => {
  const [checkInDate, setCheckInDate] = useState(initialCheckInDate || getDefaultCheckIn());
  const [checkOutDate, setCheckOutDate] = useState(
    initialCheckOutDate || getMinCheckOutDate(initialCheckInDate || getDefaultCheckIn())
  );
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [stayType, setStayType] = useState<'DAILY' | 'HOURLY'>('DAILY');
  const [durationHours, setDurationHours] = useState(2);
  const [males, setMales] = useState(1);
  const [females, setFemales] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId || '');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [autoCheckIn, setAutoCheckIn] = useState(true);
  const [securityDeposit, setSecurityDeposit] = useState(1000);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: roomsRes } = useGetAdminRoomsQuery({ status: 'ACTIVE' });
  const [createBooking, { isLoading: isCreating }] = useCreateBookingMutation();
  const [checkInStay, { isLoading: isCheckingIn }] = useCheckInStayMutation();
  const [validateVoucher, { isLoading: isValidatingVoucher }] = useValidateVoucherMutation();

  const rooms = roomsRes?.data || [];
  const nights = calculateNights(checkInDate, checkOutDate);
  const isToday = checkInDate === getDefaultCheckIn();

  // Short-stay hotel policy check
  const isShortStay = stayType === 'HOURLY' && durationHours <= 3;
  const isPolicyViolation = isShortStay && males >= 1 && females >= 1;

  // Selected room details
  const selectedRoom = rooms.find((r: any) => r._id === selectedRoomId);
  const roomTypeName =
    typeof selectedRoom?.roomTypeId === 'object'
      ? (selectedRoom.roomTypeId as any)?.name
      : 'Deluxe Room';
  const baseNightRate =
    typeof selectedRoom?.roomTypeId === 'object'
      ? (selectedRoom.roomTypeId as any)?.baseRate || 250000
      : 250000;

  // Estimated Pricing Calculation
  const subtotalPaise =
    stayType === 'HOURLY'
      ? Math.round((baseNightRate / 4) * durationHours)
      : baseNightRate * nights;

  const discountPaise = appliedVoucher ? appliedVoucher.discountPaise : 0;
  const netTaxable = Math.max(0, subtotalPaise - discountPaise);
  const taxesPaise = Math.round(netTaxable * 0.12);
  const totalPayablePaise = netTaxable + taxesPaise;

  // Synchronize initial dates & room whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialCheckInDate) setCheckInDate(initialCheckInDate);
      if (initialCheckOutDate) setCheckOutDate(initialCheckOutDate);
      if (initialRoomId) {
        setSelectedRoomId(initialRoomId);
      } else if (rooms.length > 0 && !selectedRoomId) {
        const cleanVacant = rooms.find(
          (r: any) => r.status === 'ACTIVE' && !r.isOccupied && r.housekeepingStatus === 'CLEAN'
        );
        if (cleanVacant) {
          setSelectedRoomId(cleanVacant._id);
        } else if (rooms[0]) {
          setSelectedRoomId(rooms[0]._id);
        }
      }
    }
  }, [isOpen, initialRoomId, initialCheckInDate, initialCheckOutDate, rooms]);

  const handleCheckInChange = (newIn: string) => {
    setCheckInDate(newIn);
    if (newIn >= checkOutDate) {
      setCheckOutDate(getMinCheckOutDate(newIn));
    }
    setAppliedVoucher(null);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setFormError(null);

    try {
      const res = await validateVoucher({
        code: voucherCode.trim().toUpperCase(),
        subtotal: subtotalPaise,
      }).unwrap();

      if (res.success && res.data) {
        setAppliedVoucher({
          code: voucherCode.trim().toUpperCase(),
          discountPaise: res.data.discountPaise,
          message: res.data.message || `Voucher applied: -${formatCurrency(res.data.discountPaise)}`,
        });
      }
    } catch (err: any) {
      setAppliedVoucher(null);
      setFormError(err?.data?.error?.message || 'Invalid or expired voucher code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedRoomId) {
      setFormError('Please select a room to assign to the guest');
      return;
    }

    if (isPolicyViolation) {
      setFormError(
        'Hotel Policy Warning: Short-stay (1-3 hrs) reservations with male & female guests are strictly prohibited per management guidelines.'
      );
      return;
    }

    try {
      const bookingPayload: any = {
        guestDetails: {
          fullName: guestName.trim(),
          mobile: guestPhone.trim(),
          email: guestEmail.trim() || undefined,
        },
        roomTypeId:
          typeof selectedRoom?.roomTypeId === 'object'
            ? (selectedRoom.roomTypeId as any)?._id
            : selectedRoom?.roomTypeId,
        assignedRoomId: selectedRoomId,
        checkInDate,
        checkOutDate: stayType === 'HOURLY' ? checkInDate : checkOutDate,
        numberOfGuests: guestCount,
        stayType,
        durationHours: stayType === 'HOURLY' ? durationHours : undefined,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
        source: 'FRONT_DESK',
      };

      const res = await createBooking(bookingPayload).unwrap();

      if (res.success && res.data) {
        const newBooking = res.data;

        const bookingId = newBooking._id || (newBooking as any)?.booking?._id;
        if (autoCheckIn && isToday && bookingId) {
          try {
            await checkInStay({
              id: bookingId,
              body: {
                depositCollected: rupeesToPaise(securityDeposit),
                notes: 'Instant walk-in check-in via Front Desk reservation modal',
              },
            }).unwrap();
          } catch (checkInErr: any) {
            console.error('Instant check-in notice:', checkInErr);
          }
        }

        onSuccess?.(
          `Reservation ${newBooking.bookingReference} created successfully${
            autoCheckIn && isToday ? ' & guest checked in!' : '!'
          }`
        );
        onClose();
      }
    } catch (err: any) {
      setFormError(err?.data?.error?.message || 'Failed to create reservation');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Hotel Reservation / Front Desk Booking"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {formError && <ErrorMessage title="Booking Error" message={formError} />}

        {/* 1. Date Selection & Stay Type */}
        <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#1E293B] dark:text-slate-100 text-xs flex items-center gap-1.5 text-[#487FFF]">
              <CalendarDays className="w-4 h-4 text-[#487FFF]" /> 1. Select Dates (Today or Any Future Date)
            </span>
            <span className="font-bold text-[#10B981] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px]">
              {stayType === 'DAILY' ? `${nights} ${nights === 1 ? 'Night' : 'Nights'}` : `${durationHours} Hours Short-Stay`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-200 mb-1">
                Check-in Date *
              </label>
              <input
                type="date"
                value={checkInDate}
                min={getDefaultCheckIn()}
                onChange={(e) => handleCheckInChange(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-700 text-[#1E293B] dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-[#487FFF]/20 focus:border-[#487FFF] outline-none transition-all shadow-xs"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                {formatDisplayDate(checkInDate)} {isToday && '(Today)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-200 mb-1">
                Check-out Date *
              </label>
              <input
                type="date"
                value={checkOutDate}
                min={getMinCheckOutDate(checkInDate)}
                onChange={(e) => {
                  setCheckOutDate(e.target.value);
                  setAppliedVoucher(null);
                }}
                disabled={stayType === 'HOURLY'}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-700 text-[#1E293B] dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-[#487FFF]/20 focus:border-[#487FFF] outline-none transition-all shadow-xs disabled:opacity-50"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                {formatDisplayDate(checkOutDate)}
              </span>
            </div>
          </div>

          {/* Stay Type Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStayType('DAILY')}
              className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all shadow-xs ${
                stayType === 'DAILY'
                  ? 'bg-[#487FFF] border-[#487FFF] text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-[#EAECF0] dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50'
              }`}
            >
              Standard Stay (Nightly)
            </button>
            <button
              type="button"
              onClick={() => setStayType('HOURLY')}
              className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all shadow-xs ${
                stayType === 'HOURLY'
                  ? 'bg-[#487FFF] border-[#487FFF] text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-[#EAECF0] dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50'
              }`}
            >
              Short-Stay (1-3 Hours)
            </button>
          </div>

          {/* Hourly options */}
          {stayType === 'HOURLY' && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EAECF0] dark:border-slate-700">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">
                  Duration
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-700 text-xs text-gray-800 dark:text-slate-200 outline-none"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">
                  Males
                </label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={males}
                  onChange={(e) => setMales(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-700 text-xs text-gray-800 dark:text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">
                  Females
                </label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={females}
                  onChange={(e) => setFemales(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-700 text-xs text-gray-800 dark:text-slate-200 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Guest Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Guest Full Name *"
            placeholder="e.g. Ramesh Kumar"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
          />
          <Input
            label="Mobile Number *"
            placeholder="9876543210"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="guest@example.com (optional)"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
          />
        </div>

        {/* 3. Room Assignment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#1E293B] dark:text-slate-200">
              Assign Room *
            </label>
            <span className="text-[11px] text-gray-400">
              {rooms.length} Active Hotel Rooms
            </span>
          </div>
          <select
            value={selectedRoomId}
            onChange={(e) => {
              setSelectedRoomId(e.target.value);
              setAppliedVoucher(null);
            }}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] hover:bg-white focus:bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-700 text-xs text-[#1E293B] dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-[#487FFF]/20 focus:border-[#487FFF] transition-all shadow-xs"
          >
            <option value="">-- Choose Assigned Room --</option>
            {rooms.map((r: any) => {
              const isClean = r.housekeepingStatus === 'CLEAN';
              return (
                <option key={r._id} value={r._id}>
                  Room {r.roomNumber} (Floor {r.floor || 1}) — {
                    typeof r.roomTypeId === 'object' ? r.roomTypeId?.name : 'Standard'
                  } [{isClean ? 'Clean ✓' : r.housekeepingStatus}]
                </option>
              );
            })}
          </select>
        </div>

        {/* 4. Voucher / Promo Code Box */}
        <div className="p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#1E293B] dark:text-slate-200 text-xs flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#487FFF]" /> Apply Voucher / Coupon Code
            </span>
            <span className="text-[11px] text-gray-400">
              Try: GRAND10, FLAT500, OMRSPECIAL
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ENTER VOUCHER (e.g. GRAND10)"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-700 text-xs font-mono uppercase tracking-wider text-[#1E293B] dark:text-slate-100 outline-none focus:border-[#487FFF] shadow-xs"
            />
            <button
              type="button"
              disabled={isValidatingVoucher}
              onClick={handleApplyVoucher}
              className="px-4 py-2 bg-[#487FFF] hover:bg-[#3868E0] text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-500/20 disabled:opacity-50"
            >
              {isValidatingVoucher ? 'Checking...' : 'Apply Code'}
            </button>
          </div>

          {appliedVoucher && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#10B981] text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{appliedVoucher.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedVoucher(null)}
                className="text-rose-500 hover:underline font-bold"
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>

        {/* 5. Pricing Summary */}
        <div className="p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-700/80 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500 dark:text-slate-400">
            <span>Room Subtotal ({nights} night{nights > 1 ? 's' : ''}):</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(subtotalPaise)}</span>
          </div>
          {discountPaise > 0 && (
            <div className="flex justify-between font-bold text-[#10B981]">
              <span>Voucher Discount ({appliedVoucher?.code}):</span>
              <span>- {formatCurrency(discountPaise)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500 dark:text-slate-400">
            <span>Taxes & GST (12%):</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(taxesPaise)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#EAECF0] dark:border-slate-700 font-bold text-sm text-[#1E293B] dark:text-white">
            <span>Total Payable:</span>
            <span className="text-[#487FFF] font-mono text-base">
              {formatCurrency(totalPayablePaise)}
            </span>
          </div>
        </div>

        {/* 6. Instant Check-In option if check-in is today */}
        {isToday && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCheckIn}
                onChange={(e) => setAutoCheckIn(e.target.checked)}
                className="rounded text-[#10B981] w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">
                  Check-in Guest Immediately (Issue Key & Active Folio)
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400">
                  Guest is present at desk today. Mark stay active right now.
                </span>
              </div>
            </label>
            {autoCheckIn && (
              <div className="w-32">
                <input
                  type="number"
                  placeholder="Deposit ₹"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-gray-800 dark:text-slate-100 outline-none shadow-xs"
                  title="Security Deposit in ₹"
                />
              </div>
            )}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#EAECF0] dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating || isCheckingIn || isPolicyViolation}
            className="px-6 py-2.5 rounded-xl bg-[#487FFF] hover:bg-[#3868E0] text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {isCreating || isCheckingIn
              ? 'Processing...'
              : autoCheckIn && isToday
              ? 'Confirm & Check-In Now'
              : 'Confirm Reservation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
