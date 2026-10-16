import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Users, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useCheckAvailabilityQuery } from '../availabilityApi';
import { SearchWidget } from '../components/SearchWidget';
import { RoomCard } from '@/features/rooms/components/RoomCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { PageHeader } from '@/components/common/PageHeader';
import { getDefaultCheckIn, getDefaultCheckOut, formatDisplayDate, calculateNights } from '@/utils/dates';
import { RoomType, AvailableRoomOption } from '@/types';
import { useAppDispatch } from '@/app/hooks';
import { setSelectedRoomType } from '@/features/bookings/checkoutSlice';

export const AvailabilityResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const checkIn = searchParams.get('checkIn') || getDefaultCheckIn();
  const checkOut = searchParams.get('checkOut') || getDefaultCheckOut();
  const guests = Number(searchParams.get('guests')) || 2;
  const rooms = Number(searchParams.get('rooms')) || 1;
  const discountCode = searchParams.get('discountCode') || undefined;

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useCheckAvailabilityQuery(
    { checkIn, checkOut, guests, rooms, discountCode },
    { refetchOnMountOrArgChange: true }
  );

  const rawData: any = response?.data;
  const availableOptions: AvailableRoomOption[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.roomTypes)
    ? rawData.roomTypes
    : [];

  const nights = calculateNights(checkIn, checkOut);

  const handleSelectRoom = (roomType: RoomType, option: AvailableRoomOption) => {
    const normalizedRoomType: RoomType = {
      ...roomType,
      _id: roomType._id || (roomType as any).id,
    };
    dispatch(setSelectedRoomType(normalizedRoomType));
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        eyebrow="Real-Time Inventory"
        title="Available Rooms & Direct Rates"
        subtitle={`Showing verified room availability from ${formatDisplayDate(checkIn)} to ${formatDisplayDate(
          checkOut
        )} (${nights} ${nights === 1 ? 'Night' : 'Nights'}).`}
      />

      {/* Embedded Search Widget to modify dates on the fly */}
      <div className="mb-10">
        <SearchWidget compact={true} />
      </div>

      {/* Main Results Container */}
      {isLoading || isFetching ? (
        <LoadingSpinner size="lg" message="Checking real-time MongoDB inventory locks..." fullPage />
      ) : isError ? (
        <ErrorMessage
          title="Availability check failed"
          message="Could not verify room availability for the selected dates. Please try selecting different dates."
          onRetry={refetch}
        />
      ) : availableOptions.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-12 text-center max-w-xl mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-stone-100">
            No Rooms Available for These Dates
          </h3>
          <p className="mt-2 text-sm text-stone-400">
            All rooms are reserved or held for this duration. Try adjusting your check-in and
            check-out dates above or call our 24/7 front desk.
          </p>
          <a
            href="tel:8110018708"
            className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-gold-500 text-stone-950 font-bold text-xs uppercase tracking-wider"
          >
            Call Front Desk: +91 81100 18708
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-stone-400 pb-2">
            <span>
              Found <strong className="text-stone-100">{availableOptions.length}</strong> matching
              room types
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Rates locked with Instant Confirmation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableOptions.map((opt, idx) => {
              const rt: RoomType = {
                ...opt.roomType,
                _id: (opt.roomType as any)._id || (opt.roomType as any).id || `rt_${idx}`,
              };
              return (
                <RoomCard
                  key={rt._id}
                  roomType={rt}
                  availableCount={opt.availableRoomsCount}
                  customPricePaise={opt.pricing?.perNightBreakdown?.[0]?.effectiveRate || (opt.pricing ? opt.pricing.subtotal / nights : undefined)}
                  onSelect={(selected) => handleSelectRoom(selected, opt)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
