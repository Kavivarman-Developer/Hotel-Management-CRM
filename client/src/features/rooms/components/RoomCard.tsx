import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Bed, Wifi, Tv, Wind, Coffee, ArrowRight } from 'lucide-react';
import { RoomType } from '@/types';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { Button } from '@/components/common/Button';

interface RoomCardProps {
  roomType: RoomType;
  onSelect?: (roomType: RoomType) => void;
  availableCount?: number;
  customPricePaise?: number;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  roomType,
  onSelect,
  availableCount,
  customPricePaise,
}) => {
  const displayImage =
    roomType.images && roomType.images.length > 0
      ? roomType.images[0]
      : 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80';

  const pricePaise = customPricePaise || roomType.defaultNightlyRate || 179900;

  const amenityIcons: Record<string, React.ReactNode> = {
    'High-speed Wi-Fi': <Wifi className="w-3.5 h-3.5" />,
    'Air Conditioning': <Wind className="w-3.5 h-3.5" />,
    'Smart TV': <Tv className="w-3.5 h-3.5" />,
    'Coffee / Tea Maker': <Coffee className="w-3.5 h-3.5" />,
  };

  return (
    <div className="group rounded-2xl border border-stone-800 bg-stone-900/60 overflow-hidden card-hover-luxury flex flex-col h-full backdrop-blur-sm">
      {/* Room Image with overlay badge */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-950">
        <img
          src={displayImage}
          alt={roomType.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/30" />

        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-forest-900/90 text-emerald-300 border border-emerald-600/40 backdrop-blur-md">
            {roomType.category}
          </span>
        </div>

        {availableCount !== undefined && (
          <div className="absolute top-3 right-3">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md border ${
                availableCount > 0
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                  : 'bg-rose-950/80 text-rose-300 border-rose-600/40'
              }`}
            >
              {availableCount > 0 ? `${availableCount} Rooms Left` : 'Sold Out'}
            </span>
          </div>
        )}
      </div>

      {/* Room Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-stone-400 mb-2">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gold-400" /> Up to{' '}
              {roomType.maxGuests || roomType.maxOccupancy?.total || 2} Guests
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-gold-400" /> {roomType.bedConfiguration || 'King Bed'}
            </span>
          </div>

          <h3 className="font-serif text-lg font-bold text-stone-100 group-hover:text-gold-300 transition-colors">
            {roomType.name}
          </h3>

          <p className="mt-2 text-xs text-stone-400 line-clamp-2 leading-relaxed">
            {roomType.description}
          </p>

          {/* Quick Amenities */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(roomType.amenities || []).slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800/80 text-[11px] text-stone-300 border border-stone-700/60"
              >
                {amenityIcons[amenity] || <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />}
                <span>{amenity}</span>
              </span>
            ))}
            {(roomType.amenities || []).length > 4 && (
              <span className="text-[11px] text-stone-500 self-center">
                +{(roomType.amenities || []).length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
          <PriceDisplay amountPaise={pricePaise} perNight={true} size="md" />

          {onSelect ? (
            <Button
              variant="gold"
              size="sm"
              disabled={availableCount === 0}
              onClick={() => onSelect(roomType)}
            >
              {availableCount === 0 ? 'Unavailable' : 'Book Room'}
            </Button>
          ) : (
            <Link to={`/rooms`}>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Details
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
