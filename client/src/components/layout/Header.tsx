import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Calendar, User, Search, Menu, X, ShieldCheck } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { toggleMobileMenu, setMobileMenuOpen } from '@/app/uiSlice';
import { Button } from '@/components/common/Button';

export const Header: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { mobileMenuOpen } = useAppSelector((state) => state.ui);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Rooms & Suites', path: '/rooms' },
    { label: 'Check Availability', path: '/availability' },
    { label: 'Find Reservation', path: '/my-booking' },
    { label: 'Partner Hotels', path: '/partners' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gold-500/20 bg-stone-950/85 backdrop-blur-md">
      {/* Top micro-bar */}
      <div className="hidden sm:block border-b border-stone-800/60 bg-forest-950/60 px-4 py-1.5 text-xs text-stone-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-gold-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Booking Best Rate Guarantee
            </span>
            <span className="text-stone-500">|</span>
            <span className="text-stone-300">5, Rajiv Gandhi Salai, Navalur, Chennai</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:8110018708"
              className="flex items-center gap-1.5 text-gold-300 hover:text-gold-200 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>+91 81100 18708</span>
            </a>
            {isAuthenticated ? (
              <Link
                to="/admin/dashboard"
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                PMS Portal ({user?.role})
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-stone-400 hover:text-gold-300 transition-colors"
              >
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 p-0.5 shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-forest-950 rounded-[10px] flex items-center justify-center text-gold-400 font-serif font-bold text-lg">
                G
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-serif tracking-wider text-base sm:text-lg font-bold text-stone-100 group-hover:text-gold-300 transition-colors">
                GRAND OMR
              </span>
              <span className="text-[10px] font-medium tracking-[0.25em] text-gold-500 uppercase -mt-1">
                Residency • Navalur
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-gold-400 bg-gold-500/10 border border-gold-500/20'
                    : 'text-stone-300 hover:text-gold-300 hover:bg-stone-900/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/availability">
              <Button
                variant="gold"
                size="md"
                leftIcon={<Calendar className="w-4 h-4" />}
                className="shadow-md shadow-gold-500/20"
              >
                Book Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link to="/availability">
              <Button variant="gold" size="sm" className="sm:hidden">
                Book
              </Button>
            </Link>
            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-gold-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-800 bg-stone-950/98 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className={`block px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-stone-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-stone-800 space-y-3">
            <a
              href="tel:8110018708"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gold-400 font-semibold"
            >
              <Phone className="w-4 h-4" /> Call: +91 81100 18708
            </a>
            {isAuthenticated ? (
              <Link
                to="/admin/dashboard"
                onClick={() => dispatch(setMobileMenuOpen(false))}
                className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 font-medium"
              >
                <User className="w-4 h-4" /> Go to Staff Portal ({user?.role})
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => dispatch(setMobileMenuOpen(false))}
                className="flex items-center gap-2 px-4 py-2 text-sm text-stone-400"
              >
                <User className="w-4 h-4" /> Staff / Admin Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
