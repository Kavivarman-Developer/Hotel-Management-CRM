import React from 'react';
import {
  Wifi,
  Zap,
  Tv,
  Sparkles,
  UtensilsCrossed,
  Shield,
  Car,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

export const AmenitiesSection: React.FC = () => {
  const amenities = [
    {
      icon: Wifi,
      title: 'High-Speed Fiber Wi-Fi',
      desc: 'Seamless dual-band gigabit connectivity for Zoom meetings and streaming throughout your stay.',
    },
    {
      icon: Zap,
      title: '24/7 Uninterrupted Power',
      desc: 'Heavy-duty automatic diesel generator backup guarantees seamless power 24 hours a day.',
    },
    {
      icon: Laptop,
      title: 'Ergonomic Workstations',
      desc: 'Dedicated executive work desks with universal power sockets in every room.',
    },
    {
      icon: Tv,
      title: 'Smart LED 4K TVs',
      desc: 'OTT ready with Netflix, Prime, and YouTube pre-enabled for your entertainment.',
    },
    {
      icon: UtensilsCrossed,
      title: 'In-Room Dining Service',
      desc: 'Freshly prepared South Indian, North Indian, and continental breakfast and meals.',
    },
    {
      icon: Car,
      title: 'Secure Valet Parking',
      desc: 'Spacious on-site car and two-wheeler parking with 24/7 security surveillance.',
    },
    {
      icon: Sparkles,
      title: 'Hospital-Grade Sanitization',
      desc: 'Daily professional housekeeping with fresh laundered linen and sanitized bathrooms.',
    },
    {
      icon: Shield,
      title: 'Round-the-Clock Security',
      desc: 'CCTV surveillance, electronic door locks, and responsive front-desk assistance.',
    },
  ];

  return (
    <section className="py-20 bg-stone-900/40 border-y border-stone-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Elevated Comfort</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-100">
            Thoughtfully Curated Amenities
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-400">
            Every convenience designed to make your corporate residency or weekend getaway effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {amenities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-gold-500/30 transition-all duration-300 card-hover-luxury group"
              >
                <div className="w-12 h-12 rounded-xl bg-forest-900/60 border border-emerald-700/40 flex items-center justify-center text-gold-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base font-bold text-stone-100 mb-2 group-hover:text-gold-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Brand guarantee banner */}
        <div className="mt-16 rounded-2xl border border-gold-500/30 bg-gradient-to-r from-forest-950 via-stone-900 to-forest-950 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-serif text-lg font-bold text-stone-100">
              Need Early Check-In or Extended Corporate Stays?
            </h4>
            <p className="text-xs text-stone-400">
              Our 24-hour concierge coordinates customized invoicing, corporate GST filing, and
              airport transfers.
            </p>
          </div>
          <a
            href="tel:8110018708"
            className="px-6 py-3 rounded-xl bg-gold-500 text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-gold-400 transition-colors shrink-0 shadow-lg shadow-gold-500/20"
          >
            Call Front Desk: 8110018708
          </a>
        </div>
      </div>
    </section>
  );
};
