import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Calendar,
  User,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle,
  Printer,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useLazyGetBookingByReferenceQuery, useCancelBookingMutation } from '../bookingsApi';
import {
  useGetBookingExtraStaysQuery,
  useSubmitExtraStayRequestMutation,
  ExtraStayRequest,
} from '@/features/extra-stays/extraStaysApi';
import { joinBookingRoom, getSocket } from '@/services/socket';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { formatCurrency } from '@/utils/formatters';
import { formatDisplayDate } from '@/utils/dates';

export const BookingLookupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [reference, setReference] = useState(initialRef);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  const [triggerLookup, { data: response, isLoading, isError }] =
    useLazyGetBookingByReferenceQuery();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Extra Stay state
  const [isExtraStayModalOpen, setIsExtraStayModalOpen] = useState(false);
  const [extraHours, setExtraHours] = useState<number>(2);
  const [extraReason, setExtraReason] = useState<string>('Flight delayed / Evening departure');
  const [extraStaySuccessMsg, setExtraStaySuccessMsg] = useState<string | null>(null);
  const [extraStayError, setExtraStayError] = useState<string | null>(null);

  const [submitExtraStay, { isLoading: isSubmittingExtraStay }] = useSubmitExtraStayRequestMutation();

  const booking = response?.data;

  // Extra Stays query for this booking
  const { data: extraStaysRes, refetch: refetchExtraStays } = useGetBookingExtraStaysQuery(
    booking?.bookingReference || '',
    { skip: !booking?.bookingReference, pollingInterval: 10000 }
  );

  const extraStayRequests: ExtraStayRequest[] = extraStaysRes?.data || [];
  const latestRequest = extraStayRequests[0];

  // Socket room join for real-time guest updates
  useEffect(() => {
    if (booking?.bookingReference) {
      joinBookingRoom(booking.bookingReference);
      const socket = getSocket();
      const handleUpdate = () => {
        refetchExtraStays();
      };
      socket.on('extra_stay:updated', handleUpdate);
      return () => {
        socket.off('extra_stay:updated', handleUpdate);
      };
    }
  }, [booking?.bookingReference, refetchExtraStays]);

  // Auto trigger if ref param present
  useEffect(() => {
    if (initialRef.trim()) {
      triggerLookup({
        reference: initialRef.trim().toUpperCase(),
      });
    }
  }, [initialRef, triggerLookup]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCancelSuccessMsg(null);
    setExtraStaySuccessMsg(null);
    if (!reference.trim()) return;

    triggerLookup({
      reference: reference.trim().toUpperCase(),
      email: email.trim() || undefined,
      mobile: mobile.trim() || undefined,
    });
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;
    try {
      await cancelBooking({
        reference: booking.bookingReference,
        reason: cancelReason || 'Guest requested online cancellation',
      }).unwrap();

      setIsCancelModalOpen(false);
      setCancelSuccessMsg('Your reservation has been successfully cancelled.');
      triggerLookup({
        reference: booking.bookingReference,
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
      });
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to cancel reservation');
    }
  };

  const handleSubmitExtraStay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setExtraStayError(null);
    try {
      await submitExtraStay({
        bookingReference: booking.bookingReference,
        requestedExtraHours: extraHours,
        reason: extraReason,
      }).unwrap();

      setIsExtraStayModalOpen(false);
      setExtraStaySuccessMsg(
        `Your request for +${extraHours} hours extra stay has been submitted to the front desk.`
      );
      refetchExtraStays();
    } catch (err: any) {
      setExtraStayError(err?.data?.error?.message || 'Failed to submit extra stay request');
    }
  };

  const hourlyRateRupees = 200;
  const calculatedFeeRupees = extraHours * hourlyRateRupees;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        eyebrow="Guest Self-Service Portal"
        title="Find & Manage Reservation"
        subtitle="Access your stay itinerary, view digital check-in passes, request late check-out extra hours, or manage cancellations."
      />

      {/* Lookup Form */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 md:p-8 backdrop-blur-md mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Booking Reference ID"
                placeholder="e.g. GOR-20261015-XYZ1"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div>
              <Input
                label="Email (Used during booking)"
                type="email"
                placeholder="guest@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Or 10-Digit Mobile"
                type="tel"
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="gold"
              size="md"
              isLoading={isLoading}
              leftIcon={<Search className="w-4 h-4" />}
            >
              Retrieve Booking
            </Button>
          </div>
        </form>
      </div>

      {cancelSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {extraStaySuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{extraStaySuccessMsg}</span>
          </div>
          <button onClick={() => setExtraStaySuccessMsg(null)} className="text-emerald-400">
            ✕
          </button>
        </div>
      )}

      {/* Results View */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Searching reservation database..." />
      ) : isError ? (
        <ErrorMessage
          title="Reservation Not Found"
          message="Could not find a reservation matching the provided details. Please check your Booking ID or verification email/mobile."
        />
      ) : booking ? (
        <div className="rounded-2xl border border-gold-500/30 bg-stone-900/80 p-6 md:p-8 backdrop-blur-md space-y-6 shadow-xl">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 block mb-1">
                Booking Reference
              </span>
              <h2 className="font-mono text-2xl font-bold text-gold-400">
                {booking.bookingReference}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.reservationStatus} size="md" />
              <StatusBadge status={booking.paymentStatus} size="md" />
              <StatusBadge status={booking.stayStatus} size="md" />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            <div>
              <span className="text-stone-400 block mb-1">Guest Name</span>
              <span className="text-stone-100 font-semibold text-sm">
                {typeof booking.guestId === 'object' ? booking.guestId?.fullName : 'Guest'}
              </span>
            </div>

            <div>
              <span className="text-stone-400 block mb-1">Stay Dates</span>
              <span className="text-stone-100 font-semibold">
                {formatDisplayDate(booking.checkInDate)} – {formatDisplayDate(booking.checkOutDate)}
              </span>
            </div>

            <div>
              <span className="text-stone-400 block mb-1">Total Bill</span>
              <span className="text-gold-400 font-bold text-sm">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>

            <div>
              <span className="text-stone-400 block mb-1">Check-Out Deadline</span>
              <span className="text-emerald-400 font-semibold">
                {formatDisplayDate(booking.checkOutDate)} at 11:00 AM
              </span>
            </div>
          </div>

          {/* EXTRA STAY / LATE CHECKOUT SECTION */}
          {booking.reservationStatus !== 'CANCELLED' && booking.stayStatus !== 'CHECKED_OUT' && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-gold-500/10 to-stone-900 border border-amber-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                      <span>Need More Time? Request Extra Stay / Late Check-Out</span>
                      <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                    </h3>
                    <p className="text-xs text-stone-400">
                      Standard check-out is 11:00 AM. Extend your room stay by 1 to 6 hours at ₹200/hr.
                    </p>
                  </div>
                </div>

                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => setIsExtraStayModalOpen(true)}
                  leftIcon={<Clock className="w-4 h-4" />}
                >
                  Request Extra Hours
                </Button>
              </div>

              {/* Status of recent requests */}
              {latestRequest && (
                <div className="pt-3 border-t border-amber-500/20 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-300 font-medium">
                      Latest Extension Request: +{latestRequest.requestedExtraHours} hrs ({latestRequest.newExpectedCheckOutTime})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        latestRequest.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : latestRequest.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {latestRequest.status === 'PENDING' && 'Pending Front Desk Review'}
                      {latestRequest.status === 'APPROVED' && 'Approved ✓ Check-Out Extended'}
                      {latestRequest.status === 'REJECTED' && 'Declined'}
                    </span>
                  </div>

                  {latestRequest.status === 'APPROVED' && (
                    <p className="mt-1 text-[11px] text-emerald-300 font-semibold">
                      Your stay has been extended until {latestRequest.newExpectedCheckOutTime}. Charge of{' '}
                      {formatCurrency(latestRequest.chargeAmountPaise)} logged to your folio bill.
                    </p>
                  )}

                  {latestRequest.status === 'REJECTED' && (
                    <p className="mt-1 text-[11px] text-rose-300">
                      {latestRequest.rejectionReason || 'Extension unavailable due to scheduled incoming reservation.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Summary
            </Button>

            {booking.reservationStatus !== 'CANCELLED' && booking.stayStatus === 'NOT_CHECKED_IN' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Cancel Reservation
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {/* Extra Stay Request Modal */}
      {isExtraStayModalOpen && (
        <Modal
          isOpen={isExtraStayModalOpen}
          onClose={() => setIsExtraStayModalOpen(false)}
          title="Request Extra Hours / Late Check-Out"
        >
          <form onSubmit={handleSubmitExtraStay} className="space-y-4 text-xs">
            {extraStayError && <ErrorMessage title="Request Error" message={extraStayError} />}

            <p className="text-stone-300 leading-relaxed">
              Standard hotel check-out is <strong className="text-gold-400">11:00 AM</strong>. Let us
              know how many extra hours you would like to keep your room.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-200 mb-2">
                Choose Extra Stay Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { hrs: 1, time: '12:00 PM', price: 200 },
                  { hrs: 2, time: '01:00 PM', price: 400 },
                  { hrs: 3, time: '02:00 PM', price: 600 },
                  { hrs: 4, time: '03:00 PM', price: 800 },
                  { hrs: 5, time: '04:00 PM', price: 1000 },
                  { hrs: 6, time: '05:00 PM', price: 1200 },
                ].map((opt) => (
                  <button
                    key={opt.hrs}
                    type="button"
                    onClick={() => setExtraHours(opt.hrs)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      extraHours === opt.hrs
                        ? 'bg-gold-500/20 border-gold-500 text-gold-300 font-bold shadow-md'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-stone-100">+{opt.hrs} Hour{opt.hrs > 1 ? 's' : ''}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Until {opt.time}</div>
                    <div className="text-[11px] font-mono text-gold-400 mt-1 font-bold">₹{opt.price}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-200 mb-1.5">
                Reason for Extension *
              </label>
              <select
                value={extraReason}
                onChange={(e) => setExtraReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs mb-2 outline-none"
              >
                <option value="Flight delayed / Evening flight departure">Flight delayed / Evening flight departure</option>
                <option value="Train delayed / Rescheduled journey">Train delayed / Rescheduled journey</option>
                <option value="Business meeting or conference extended">Business meeting or conference extended</option>
                <option value="Rest and freshen up before travel">Rest and freshen up before travel</option>
                <option value="Family / Personal reasons">Family / Personal reasons</option>
                <option value="Other">Other reason (describe below)</option>
              </select>

              <textarea
                rows={2}
                value={extraReason}
                onChange={(e) => setExtraReason(e.target.value)}
                placeholder="Provide extra details for front desk..."
                className="w-full bg-stone-950 text-stone-100 text-xs rounded-xl border border-stone-800 p-2.5 outline-none focus:border-gold-500"
                required
              />
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-stone-400 text-xs block">Estimated Extra Charge:</span>
                <span className="text-[10px] text-stone-500">Payable at front desk or folio</span>
              </div>
              <span className="text-xl font-bold font-mono text-gold-400">
                ₹{calculatedFeeRupees}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
              <Button variant="ghost" size="sm" onClick={() => setIsExtraStayModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                type="submit"
                isLoading={isSubmittingExtraStay}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                Submit Request to Front Desk
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Reservation Cancellation"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-300 leading-relaxed">
            Are you sure you want to cancel reservation{' '}
            <strong className="text-gold-400">{booking?.bookingReference}</strong>? This will release
            the locked room back to the hotel inventory.
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Reason for Cancellation
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Travel plan changed, rescheduled"
              className="w-full bg-stone-950 text-stone-100 text-xs rounded-lg border border-stone-800 p-3 outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isCancelling}
              onClick={handleConfirmCancel}
            >
              Yes, Cancel Reservation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
