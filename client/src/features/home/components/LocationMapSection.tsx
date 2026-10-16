import React from 'react';
import { MapPin, Navigation, Car, Compass, Building, Plane } from 'lucide-react';

export const LocationMapSection: React.FC = () => {
  const nearbyLandmarks = [
    { name: 'SIPCOT IT Park, Siruseri', distance: '5 mins', icon: Building },
    { name: 'Marina Mall, Navalur', distance: '2 mins', icon: Compass },
    { name: 'TCS & Cognizant OMR Campuses', distance: '7 mins', icon: Building },
    { name: 'ECR Beaches (Muttukadu / Kovalam)', distance: '15 mins', icon: Navigation },
    { name: 'Chennai International Airport (MAA)', distance: '40 mins', icon: Plane },
  ];

  return (
    <section className="py-20 bg-stone-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text and distance points */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>Strategic Navalur Hub</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-100">
              The Heart of Chennai’s Technology Expressway
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-400 leading-relaxed">
              Situated right on Rajiv Gandhi Salai (OMR), GRAND OMR RESIDENCY puts you within easy
              reach of Asia's largest IT tech parks, prestigious engineering universities, gourmet
              dining, and coastal beach escapes.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-forest-950/50 border border-emerald-900/40 text-xs text-stone-300 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-100 block font-semibold">Address:</strong>
                <span>
                  5, Rajiv Gandhi Salai, Sholinganallur, Navalur, Tamil Nadu 600130
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-400">
                Key Proximity & Driving Times:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nearbyLandmarks.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-stone-900/70 border border-stone-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5 text-stone-200">
                        <Icon className="w-4 h-4 text-gold-400" />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-bold text-emerald-400">{item.distance}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="https://maps.google.com/?q=5+Rajiv+Gandhi+Salai+Navalur+Chennai+600130"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-gold-400 border border-gold-500/30 text-xs font-semibold tracking-wider transition-colors"
              >
                <Navigation className="w-4 h-4" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

          {/* Interactive visual location card */}
          <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4 shadow-2xl relative overflow-hidden group">
            <div className="aspect-[4/3] rounded-xl overflow-hidden relative bg-stone-950">
              <img
                src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80"
                alt="GRAND OMR RESIDENCY Property Architecture"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-stone-950/90 border border-gold-500/30 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-stone-100">
                      GRAND OMR RESIDENCY
                    </h4>
                    <p className="text-[11px] text-gold-400">Navalur, Chennai OMR</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-700">
                    Prime Location
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
