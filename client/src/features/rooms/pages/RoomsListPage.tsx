import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, Sparkles, Filter } from 'lucide-react';
import { useGetRoomTypesQuery } from '../roomsApi';
import { RoomCard } from '../components/RoomCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { PageHeader } from '@/components/common/PageHeader';
import { RoomType } from '@/types';
import { useAppDispatch } from '@/app/hooks';
import { setRoomTypeFilter } from '@/features/availability/bookingSearchSlice';

export const RoomsListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: response, isLoading, isError, refetch } = useGetRoomTypesQuery();

  const [activeCategory, setActiveCategory] = useState<string>('all');

  const roomTypes = response?.data || [];

  const categories = [
    { id: 'all', label: 'All Accommodations' },
    { id: 'deluxe', label: 'Deluxe Rooms' },
    { id: 'suite', label: 'Executive Suites' },
    { id: 'cottage', label: 'Garden Cottages' },
  ];

  const filteredRooms = roomTypes.filter((r) => {
    if (activeCategory === 'all') return true;
    return r.category === activeCategory;
  });

  const handleSelectRoom = (roomType: RoomType) => {
    dispatch(setRoomTypeFilter(roomType._id));
    navigate('/availability');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        eyebrow="Luxury Living"
        title="Accommodations & Suites"
        subtitle="Each residence at GRAND OMR RESIDENCY is crafted with high ceilings, plush bedding, executive desks, and modern soundproofing for peak comfort."
      />

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        <Filter className="w-4 h-4 text-stone-500 shrink-0 ml-1 mr-2" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-gold-500 text-stone-950 shadow-md shadow-gold-500/20'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading accommodations..." fullPage />
      ) : isError ? (
        <ErrorMessage
          title="Could not load rooms"
          message="An error occurred while fetching available rooms. Please try again."
          onRetry={refetch}
        />
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          No accommodations found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room._id}
              roomType={room}
              onSelect={handleSelectRoom}
            />
          ))}
        </div>
      )}
    </div>
  );
};
