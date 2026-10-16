import React, { useState } from 'react';
import { Calendar, Users, Moon, ShieldCheck, Tag, CheckCircle2 } from 'lucide-react';
import { PricingCalculationResult, RoomType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { formatDisplayDate, calculateNights } from '@/utils/dates';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setDiscountCode } from '@/features/availability/bookingSearchSlice';
import { clearHold } from '../checkoutSlice';
import { useValidateVoucherMutation } from '@/features/vouchers/vouchersApi';

interface PricingSummaryCardProps {
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms: number;
  pricing?: PricingCalculationResult | null;
}

export const PricingSummaryCard: React.FC<PricingSummaryCardProps> = ({
  roomType,
  checkInDate,
  checkOutDate,
  numberOfGuests,
  numberOfRooms,
  pricing,
}) => {
  const dispatch = useAppDispatch();
  const currentDiscountCode = useAppSelector((state) => state.bookingSearch.discountCode || '');
  const [voucherInput, setVoucherInput] = useState(currentDiscountCode);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);

  const [validateVoucher, { isLoading: isValidating }] = useValidateVoucherMutation();

  const nights = calculateNights(checkInDate, checkOutDate);

  // Fallback estimation if hold pricing is not yet calculated
  const baseRatePaise = roomType.defaultNightlyRate || (roomType as any).baseRate || 179900;
  const subtotalPaise = pricing?.subtotal ?? baseRatePaise * nights * numberOfRooms;
  const discountPaise = pricing?.discount ?? 0;
  const taxesPaise = pricing?.taxes ?? Math.round((subtotalPaise - discountPaise) * 0.12);
  const totalPaise = pricing?.totalAmount ?? subtotalPaise - discountPaise + taxesPaise;

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    setVoucherError(null);
    setVoucherSuccess(null);

    try {
      const res = await validateVoucher({
        code: voucherInput.trim().toUpperCase(),
        subtotal: subtotalPaise,
      }).unwrap();

      if (res.success && res.data) {
        dispatch(setDiscountCode(res.data.code));
        dispatch(clearHold());
        setVoucherSuccess(`Promo code applied: Save ${formatCurrency(res.data.discountPaise)}!`);
      }
    } catch (err: any) {
      setVoucherError(err?.data?.error?.message || 'Invalid or expired voucher code');
    }
  };

  const handleRemoveVoucher = () => {
    dispatch(setDiscountCode(''));
    dispatch(clearHold());
    setVoucherInput('');
    setVoucherSuccess(null);
    setVoucherError(null);
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-6 backdrop-blur-md space-y-6">
      {/* Selected Room Heading */}
      <div className="pb-4 border-b border-stone-800">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-gold-400 block mb-1">
          Your Selected Stay
        </span>
        <h3 className="font-serif text-lg font-bold text-stone-100">{roomType.name}</h3>
        <p className="text-xs text-stone-400 capitalize">{roomType.category} • {roomType.bedConfiguration}</p>
      </div>

      {/* Stay Itinerary details */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between text-stone-300">
          <span className="flex items-center gap-2 text-stone-400">
            <Calendar className="w-3.5 h-3.5 text-gold-400" /> Check-in
          </span>
          <span className="font-semibold text-stone-200">{formatDisplayDate(checkInDate)} (12:00 PM)</span>
        </div>

        <div className="flex items-center justify-between text-stone-300">
          <span className="flex items-center gap-2 text-stone-400">
            <Calendar className="w-3.5 h-3.5 text-gold-400" /> Check-out
          </span>
          <span className="font-semibold text-stone-200">{formatDisplayDate(checkOutDate)} (11:00 AM)</span>
        </div>

        <div className="flex items-center justify-between text-stone-300">
          <span className="flex items-center gap-2 text-stone-400">
            <Moon className="w-3.5 h-3.5 text-gold-400" /> Duration
          </span>
          <span className="font-semibold text-stone-200">
            {nights} {nights === 1 ? 'Night' : 'Nights'}
          </span>
        </div>

        <div className="flex items-center justify-between text-stone-300">
          <span className="flex items-center gap-2 text-stone-400">
            <Users className="w-3.5 h-3.5 text-gold-400" /> Occupancy
          </span>
          <span className="font-semibold text-stone-200">
            {numberOfGuests} {numberOfGuests === 1 ? 'Guest' : 'Guests'} ({numberOfRooms}{' '}
            {numberOfRooms === 1 ? 'Room' : 'Rooms'})
          </span>
        </div>
      </div>

      {/* Promo / Voucher Code Section */}
      <div className="pt-3 border-t border-stone-800">
        <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-gold-400">
            <Tag className="w-3.5 h-3.5" /> Have a Promo Code?
          </span>
          {currentDiscountCode && (
            <button
              type="button"
              onClick={handleRemoveVoucher}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
            >
              Remove
            </button>
          )}
        </label>

        {currentDiscountCode ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Applied: <span className="tracking-wider uppercase font-mono text-stone-100">{currentDiscountCode}</span>
            </span>
            <span className="text-[11px] font-normal text-emerald-300">Discount Applied</span>
          </div>
        ) : (
          <form onSubmit={handleApplyVoucher} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. GRAND10, FLAT500"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              className="flex-1 bg-stone-950/80 text-stone-100 text-xs rounded-xl border border-stone-800 px-3 py-2 outline-none uppercase font-mono tracking-wider focus:border-gold-500"
            />
            <button
              type="submit"
              disabled={isValidating || !voucherInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 border border-gold-500/40 text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {isValidating ? '...' : 'Apply'}
            </button>
          </form>
        )}

        {voucherSuccess && (
          <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {voucherSuccess}
          </p>
        )}
        {voucherError && (
          <p className="text-[11px] text-rose-400 mt-1.5">{voucherError}</p>
        )}
      </div>

      {/* Financial Breakdown */}
      <div className="pt-4 border-t border-stone-800 space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-stone-400">
          <span>Room Subtotal ({nights} nights × {numberOfRooms} room)</span>
          <span className="text-stone-200 font-medium">{formatCurrency(subtotalPaise)}</span>
        </div>

        {discountPaise > 0 && (
          <div className="flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Special Promo Discount
            </span>
            <span>-{formatCurrency(discountPaise)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-stone-400">
          <span>Goods & Services Tax (GST {pricing?.taxRatePercentage || 12}%)</span>
          <span className="text-stone-200 font-medium">{formatCurrency(taxesPaise)}</span>
        </div>

        <div className="pt-3 border-t border-stone-700/80 flex items-baseline justify-between">
          <div>
            <span className="font-serif text-sm font-bold text-stone-100 block">Total Due</span>
            <span className="text-[10px] text-stone-400">Includes all applicable taxes</span>
          </div>
          <span className="font-serif text-2xl font-extrabold text-gold-400">
            {formatCurrency(totalPaise)}
          </span>
        </div>
      </div>

      <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/40">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Free cancellation up to 24 hours prior to scheduled check-in.</span>
      </div>
    </div>
  );
};
