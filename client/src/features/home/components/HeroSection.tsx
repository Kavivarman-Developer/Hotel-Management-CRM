import React from 'react';
import { Star, ShieldCheck, MapPin, Sparkles, Award } from 'lucide-react';
import { SearchWidget } from '@/features/availability/components/SearchWidget';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-8 pb-16 overflow-hidden">
      {/* Background with luxury gradient and subtle ambient light */}
      <div className="absolute inset-0 bg-stone-950 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-forest-900/40 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-gold-600/10 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chennai's Premier Boutique Stay</span>
          </div>

          {/* Luxury Main Heading */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-extrabold text-stone-100 tracking-tight leading-[1.15]">
            An Oasis of Elegance on <span className="text-gold-gradient">Chennai OMR</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base md:text-lg text-stone-300 leading-relaxed max-w-2xl mx-auto">
            Experience uncompromised comfort, high-speed fiber internet, and bespoke hospitality in
            Navalur, moments away from SIPCOT IT Park and ECR coastline.
          </p>

          {/* Badges / Ratings */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-400">
            <div className="flex items-center gap-1.5 bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-800">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="font-bold text-stone-200">4.8 / 5.0</span>
              <span className="text-stone-500">(420+ Reviews)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-800 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Direct Booking Site</span>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-900/60 px-3 py-1.5 rounded-lg border border-stone-800 text-gold-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Navalur, Sholinganallur OMR</span>
            </div>
          </div>
        </div>

        {/* Floating Real-Time Booking Widget */}
        <div className="max-w-5xl mx-auto">
          <SearchWidget />
        </div>
      </div>
    </section>
  );
};
