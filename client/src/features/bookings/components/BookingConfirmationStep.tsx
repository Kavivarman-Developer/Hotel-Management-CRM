import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle,
  Copy,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Phone,
  QrCode,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { formatCurrency } from '@/utils/formatters';
import { formatDisplayDate } from '@/utils/dates';

import { getSuggestedQrOrigin } from '@/utils/network';

interface BookingConfirmationStepProps {
  booking: any;
  onReset: () => void;
}

export const BookingConfirmationStep: React.FC<BookingConfirmationStepProps> = ({
  booking,
  onReset,
}) => {
  const [qrOrigin, setQrOrigin] = React.useState<string>('http://192.168.0.106:5173');

  useEffect(() => {
    getSuggestedQrOrigin().then((origin) => {
      if (origin) setQrOrigin(origin);
    });

    // Confetti burst on mounting
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#10b981', '#ffffff', '#e4ce87'],
      });
    } catch {
      // ignore
    }
  }, []);

  const bookingRef = booking.bookingReference || 'GOR-BOOKING';
  const qrToken = booking.qrToken;
  const qrUrl = qrToken
    ? `${qrOrigin}/qr/${qrToken}`
    : `${qrOrigin}/my-booking?ref=${bookingRef}`;

  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-2xl border border-gold-500/40 bg-stone-900/90 p-6 md:p-10 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-8 text-center max-w-2xl mx-auto">
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
        <CheckCircle className="w-8 h-8" />
      </div>

      <div>
        <span className="text-xs uppercase tracking-widest text-gold-400 font-bold block mb-1">
          Reservation Confirmed
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-stone-100">
          We Look Forward to Welcoming You
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-stone-300">
          Your room has been locked and confirmed at GRAND OMR RESIDENCY, Navalur. A confirmation
          summary has been sent to your email.
        </p>
      </div>

      {/* Booking Reference Pill */}
      <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
            Booking Reference ID
          </span>
          <span className="font-mono text-base md:text-lg font-bold text-gold-400">
            {bookingRef}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Digital QR Pass Box */}
      <div className="p-6 rounded-2xl bg-forest-950/70 border border-emerald-700/40 text-left space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="p-3 bg-white rounded-xl shadow-md shrink-0">
            <QRCodeSVG value={qrUrl} size={110} level="M" />
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-gold-400 text-xs font-bold uppercase tracking-wider">
              <QrCode className="w-4 h-4" />
              <span>Express Digital Check-In Pass</span>
            </div>
            <h4 className="font-serif text-sm font-bold text-stone-100">
              Skip The Front Desk Queue
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              Scan this code upon arrival or complete your government ID registration online right
              now to collect your room key within 30 seconds.
            </p>

            {qrToken && (
              <div className="pt-1">
                <Link to={`/qr/${qrToken}`}>
                  <Button
                    variant="emerald"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="w-full sm:w-auto"
                  >
                    Complete Digital Registration
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stay Itinerary Summary */}
      <div className="grid grid-cols-2 gap-4 text-xs text-left bg-stone-950/60 p-4 rounded-xl border border-stone-800">
        <div>
          <span className="text-stone-500 block mb-0.5">Check-in</span>
          <span className="text-stone-200 font-semibold">
            {formatDisplayDate(booking.checkInDate)} (12:00 PM)
          </span>
        </div>
        <div>
          <span className="text-stone-500 block mb-0.5">Check-out</span>
          <span className="text-stone-200 font-semibold">
            {formatDisplayDate(booking.checkOutDate)} (11:00 AM)
          </span>
        </div>
        <div>
          <span className="text-stone-500 block mb-0.5">Total Amount</span>
          <span className="text-gold-400 font-bold">
            {formatCurrency(booking.totalAmount)}
          </span>
        </div>
        <div>
          <span className="text-stone-500 block mb-0.5">Reservation Status</span>
          <span className="text-emerald-400 font-semibold">
            {booking.reservationStatus || 'CONFIRMED'}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-2 text-xs text-stone-400 border-t border-stone-800 pt-4 text-left">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
          <span>5, Rajiv Gandhi Salai, Sholinganallur, Navalur, Tamil Nadu 600130</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gold-400 shrink-0" />
          <a href="tel:8110018708" className="text-stone-300 hover:text-gold-300">
            +91 81100 18708 (Front Desk & Valet)
          </a>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={handlePrint}
          leftIcon={<Printer className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Print Confirmation Voucher
        </Button>

        <Link to="/" onClick={onReset} className="w-full sm:w-auto">
          <Button variant="ghost" size="md" className="w-full sm:w-auto">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
