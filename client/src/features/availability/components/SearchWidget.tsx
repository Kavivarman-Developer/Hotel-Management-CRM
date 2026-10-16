import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, DoorClosed, Tag, Search, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setSearchDates,
  setGuests,
  setRooms,
  setDiscountCode,
} from '@/features/availability/bookingSearchSlice';
import { getDefaultCheckIn, getMinCheckOutDate, calculateNights } from '@/utils/dates';
import { Button } from '@/components/common/Button';

interface SearchWidgetProps {
  compact?: boolean;
  onSearchSubmitted?: () => void;
  className?: string;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({
  compact = false,
  onSearchSubmitted,
  className = '',
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const searchState = useAppSelector((state) => state.bookingSearch);

  const [checkIn, setCheckIn] = useState(searchState.checkInDate || getDefaultCheckIn());
  const [checkOut, setCheckOut] = useState(
    searchState.checkOutDate || getMinCheckOutDate(checkIn)
  );
  const [guestCount, setGuestCount] = useState(searchState.numberOfGuests || 2);
  const [roomCount, setRoomCount] = useState(searchState.numberOfRooms || 1);
  const [discount, setDiscount] = useState(searchState.discountCode || '');

  const nights = calculateNights(checkIn, checkOut);

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIn = e.target.value;
    setCheckIn(newIn);
    // Ensure checkOut is at least 1 day after checkIn
    if (newIn >= checkOut) {
      setCheckOut(getMinCheckOutDate(newIn));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setSearchDates({ checkInDate: checkIn, checkOutDate: checkOut }));
    dispatch(setGuests(guestCount));
    dispatch(setRooms(roomCount));
    dispatch(setDiscountCode(discount));

    if (onSearchSubmitted) {
      onSearchSubmitted();
    } else {
      navigate(
        `/availability?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestCount}&rooms=${roomCount}${
          discount ? `&discountCode=${discount}` : ''
        }`
      );
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`rounded-2xl border border-gold-500/30 bg-stone-900/90 backdrop-blur-xl shadow-2xl shadow-black/80 ${
        compact ? 'p-4' : 'p-5 sm:p-6 md:p-8'
      } ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Check-in Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gold-400">
              <Calendar className="w-3.5 h-3.5" /> Check-in
            </span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={checkIn}
              min={getDefaultCheckIn()}
              onChange={handleCheckInChange}
              required
              className="w-full bg-stone-950/80 text-stone-100 text-sm rounded-xl border border-stone-800 hover:border-gold-500/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 py-3 px-3.5 outline-none [color-scheme:dark] transition-colors"
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gold-400">
              <Calendar className="w-3.5 h-3.5" /> Check-out
            </span>
            <span className="text-[11px] font-medium text-emerald-400">
              {nights} {nights === 1 ? 'Night' : 'Nights'}
            </span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={checkOut}
              min={getMinCheckOutDate(checkIn)}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="w-full bg-stone-950/80 text-stone-100 text-sm rounded-xl border border-stone-800 hover:border-gold-500/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 py-3 px-3.5 outline-none [color-scheme:dark] transition-colors"
            />
          </div>
        </div>

        {/* Guests & Rooms */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center gap-1.5 text-gold-400">
            <Users className="w-3.5 h-3.5" /> Guests
          </label>
          <select
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="w-full bg-stone-950/80 text-stone-100 text-sm rounded-xl border border-stone-800 hover:border-gold-500/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 py-3 px-3.5 outline-none transition-colors"
          >
            <option value={1}>1 Guest (Single)</option>
            <option value={2}>2 Guests (Double)</option>
            <option value={3}>3 Guests (Family)</option>
            <option value={4}>4 Guests (Group)</option>
            <option value={6}>6 Guests (Suite)</option>
          </select>
        </div>

        {/* Promo Code */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center gap-1.5 text-gold-400">
            <Tag className="w-3.5 h-3.5" /> Offer / Promo
          </label>
          <input
            type="text"
            placeholder="GRAND10 / DIRECT"
            value={discount}
            onChange={(e) => setDiscount(e.target.value.toUpperCase())}
            className="w-full bg-stone-950/80 text-stone-100 text-sm rounded-xl border border-stone-800 hover:border-gold-500/50 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 py-3 px-3.5 outline-none uppercase placeholder:normal-case placeholder:text-stone-500 transition-colors"
          />
        </div>

        {/* Submit button */}
        <div>
          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full py-3 h-[46px] shadow-lg shadow-gold-500/25"
            leftIcon={<Search className="w-4 h-4" />}
          >
            Check Rates
          </Button>
        </div>
      </div>
    </form>
  );
};
