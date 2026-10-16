import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { FeaturedRooms } from '../components/FeaturedRooms';
import { AmenitiesSection } from '../components/AmenitiesSection';
import { LocationMapSection } from '../components/LocationMapSection';
import { ReviewsSection } from '../components/ReviewsSection';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturedRooms />
      <AmenitiesSection />
      <LocationMapSection />
      <ReviewsSection />
    </div>
  );
};
