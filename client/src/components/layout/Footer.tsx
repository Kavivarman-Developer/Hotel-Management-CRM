import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Sparkles, CreditCard, Key } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-stone-800 bg-stone-950 text-stone-300">
      {/* Value propositions banner */}
      <div className="border-b border-stone-800/80 bg-stone-900/30 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                Best Rate Guarantee
              </h4>
              <p className="text-xs text-stone-400">Direct booking always gets the best price</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                Instant Confirmation
              </h4>
              <p className="text-xs text-stone-400">Real-time inventory locks with 0 waiting</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                Digital QR Check-In
              </h4>
              <p className="text-xs text-stone-400">Skip the lobby queue with instant pass</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                Zero Hidden Charges
              </h4>
              <p className="text-xs text-stone-400">Transparent GST and price breakdowns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-0.5 shadow-md">
                <div className="w-full h-full bg-forest-950 rounded-[10px] flex items-center justify-center text-gold-400 font-serif font-bold text-base">
                  G
                </div>
              </div>
              <div>
                <span className="font-serif tracking-wider text-base font-bold text-stone-100 block">
                  GRAND OMR
                </span>
                <span className="text-[10px] tracking-widest text-gold-400 uppercase block -mt-1">
                  Residency • Navalur
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Experience boutique luxury on Chennai's premier IT Corridor. Thoughtfully crafted
              rooms, high-speed Wi-Fi, and 24/7 hospitality for business and leisure.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-stone-100 tracking-wider uppercase mb-4 text-gold-400">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/rooms" className="hover:text-gold-300 transition-colors">
                  Rooms & Suites
                </Link>
              </li>
              <li>
                <Link to="/availability" className="hover:text-gold-300 transition-colors">
                  Live Availability
                </Link>
              </li>
              <li>
                <Link to="/my-booking" className="hover:text-gold-300 transition-colors">
                  View & Manage Reservation
                </Link>
              </li>
              <li>
                <Link to="/partners" className="hover:text-gold-300 transition-colors">
                  Partner Hotel Network
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-gold-300 transition-colors text-stone-500">
                  Staff PMS Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Rooms */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-stone-100 tracking-wider uppercase mb-4 text-gold-400">
              Accommodations
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>Deluxe King Room — From ₹1,799 / night</li>
              <li>Executive Suite — From ₹2,399 / night</li>
              <li>Garden Cottage — From ₹2,999 / night</li>
              <li className="pt-2 text-[11px] text-stone-500">
                Check-in: 12:00 PM • Check-out: 11:00 AM
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-stone-100 tracking-wider uppercase mb-4 text-gold-400">
              Hotel Location
            </h4>
            <div className="space-y-3 text-xs text-stone-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>
                  5, Rajiv Gandhi Salai, Sholinganallur, Navalur, Tamil Nadu 600130
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <a href="tel:8110018708" className="hover:text-gold-300 transition-colors">
                  +91 81100 18708
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <a
                  href="mailto:reservations@grandomrresidency.com"
                  className="hover:text-gold-300 transition-colors"
                >
                  reservations@grandomrresidency.com
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-stone-500">
                <Clock className="w-4 h-4 text-gold-400 shrink-0" />
                <span>24/7 Front Desk & Concierge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} GRAND OMR RESIDENCY. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Navalur, Chennai OMR</span>
            <span>•</span>
            <span>Boutique Hospitality</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
