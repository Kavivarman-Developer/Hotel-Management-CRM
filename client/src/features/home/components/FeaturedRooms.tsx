import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useGetRoomTypesQuery } from '@/features/rooms/roomsApi';
import { RoomCard } from '@/features/rooms/components/RoomCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';

export const FeaturedRooms: React.FC = () => {
  const { data: response, isLoading, isError, refetch } = useGetRoomTypesQuery();

  const roomTypes = response?.data || [];

  return (
    <section className="py-20 bg-stone-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/60 border border-emerald-600/30 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              <span>Tailored Accommodations</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-100">
              Rooms & Signature Suites
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-400 max-w-xl">
              Impeccably appointed living spaces designed for discerning business executives,
              families, and travelers seeking quiet luxury.
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <Link to="/rooms">
              <Button
                variant="outline"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore All Rooms
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" message="Loading luxury rooms..." />
        ) : isError ? (
          <ErrorMessage
            title="Unable to load rooms"
            message="Could not retrieve the room catalog from the server. Please check your internet connection."
            onRetry={refetch}
          />
        ) : roomTypes.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            No rooms currently available. Please check back shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomTypes.slice(0, 3).map((roomType) => (
              <RoomCard key={roomType._id} roomType={roomType} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
