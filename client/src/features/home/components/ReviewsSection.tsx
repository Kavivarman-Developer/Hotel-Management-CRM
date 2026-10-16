import React from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Venkatesh Ramanathan',
      role: 'Senior Project Manager, SIPCOT IT Park',
      rating: 5,
      date: 'October 2026',
      comment:
        'Outstanding stay for corporate visits. The Wi-Fi is blazing fast with zero drops during international client calls, and the room was spotlessly clean. Digital QR registration took under 60 seconds.',
    },
    {
      name: 'Ananya Sharma',
      role: 'Consultant, Bangalore',
      rating: 5,
      date: 'September 2026',
      comment:
        'Great location right on OMR next to Marina Mall. The Executive Suite bed was extremely comfortable, and the quiet ambiance gave me an undisturbed night of rest. Direct booking was seamless!',
    },
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Family Vacation Stay',
      rating: 5,
      date: 'August 2026',
      comment:
        'We booked the Garden Cottage for 4 guests. Extremely spacious, beautiful interior accents, and attentive staff who accommodated our early breakfast request. Highly recommended in Navalur.',
    },
  ];

  return (
    <section className="py-20 bg-stone-900/30 border-t border-stone-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <Star className="w-3.5 h-3.5 fill-gold-400" />
            <span>Guest Experiences</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-100">
            Trusted by Corporate & Leisure Guests
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 card-hover-luxury flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-400">
                    {[...Array(r.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-stone-600" />
                </div>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
                  "{r.comment}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-stone-100 flex items-center gap-1.5">
                    {r.name}
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </h4>
                  <span className="text-[11px] text-stone-400">{r.role}</span>
                </div>
                <span className="text-[11px] text-stone-500">{r.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
