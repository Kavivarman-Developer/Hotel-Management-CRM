import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Search,
  Filter,
  Eye,
  XCircle,
  QrCode,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  Plus,
  DoorOpen,
  KeyRound,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  useGetAdminBookingsQuery,
  useAdminCancelBookingMutation,
  useAdminReissueQrMutation,
} from '../dashboardApi';
import { useCheckInStayMutation } from '@/features/stays/staysApi';
import { NewBookingModal } from '@/components/common/NewBookingModal';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { formatCurrency, rupeesToPaise } from '@/utils/formatters';
import { formatDisplayDate } from '@/utils/dates';
import { Booking } from '@/types';
import { getSuggestedQrOrigin } from '@/utils/network';

export const AdminBookingsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [qrHostOrigin, setQrHostOrigin] = useState<string>('http://192.168.0.106:5173');

  React.useEffect(() => {
    getSuggestedQrOrigin().then((origin) => {
      if (origin) setQrHostOrigin(origin);
    });
  }, []);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetAdminBookingsQuery({
    status: statusFilter || undefined,
    search: searchTerm || undefined,
  });

  const [adminCancelBooking, { isLoading: isCancelling }] = useAdminCancelBookingMutation();
  const [reissueQr, { isLoading: isReissuing }] = useAdminReissueQrMutation();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [qrModalBooking, setQrModalBooking] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Reservation & Check-In modals
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [checkInBooking, setCheckInBooking] = useState<Booking | null>(null);
  const [checkInDeposit, setCheckInDeposit] = useState(1000);
  const [checkInStay, { isLoading: isCheckingIn }] = useCheckInStayMutation();

  const bookings = response?.data || [];

  const handleQuickCheckIn = async () => {
    if (!checkInBooking) return;
    try {
      await checkInStay({
        id: checkInBooking._id,
        body: {
          depositCollected: rupeesToPaise(checkInDeposit),
          notes: 'Standard front desk check-in via Reservations page',
        },
      }).unwrap();

      const ref = checkInBooking.bookingReference;
      setCheckInBooking(null);
      setSuccessToast(`Guest checked in successfully for booking ${ref}`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Check-in failed');
    }
  };

  const handleCancel = async () => {
    if (!cancelModalBooking) return;
    try {
      await adminCancelBooking({
        id: cancelModalBooking._id,
        reason: cancelReason || 'Staff initiated cancellation',
      }).unwrap();

      setCancelModalBooking(null);
      setCancelReason('');
      setSuccessToast(`Booking ${cancelModalBooking.bookingReference} cancelled successfully`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Cancellation failed');
    }
  };

  const handleReissueQr = async (b: Booking) => {
    try {
      const res = await reissueQr(b._id).unwrap();
      if (res.success) {
        setSuccessToast(`New QR check-in pass re-issued for ${b.bookingReference}`);
        refetch();
      }
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to re-issue QR token');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reservations Management"
        title="Bookings & Reservations"
        subtitle="Manage guest reservations, view pricing snapshots, handle cancellations, and generate digital check-in passes."
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/admin/dashboard?tab=calendar">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CalendarDays className="w-4 h-4 text-[#487FFF]" />}
              >
                Date-wise Calendar
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewBookingModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + New Reservation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
        <div className="flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Search by Guest Name, Email, or Reference ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl w-full sm:w-auto overflow-x-auto">
          {['', 'CONFIRMED', 'HELD', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#487FFF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All Reservations' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading bookings catalog..." fullPage />
      ) : isError ? (
        <ErrorMessage
          title="Error loading bookings"
          message="Failed to retrieve bookings from the database. Please retry."
          onRetry={refetch}
        />
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-stone-500 bg-white dark:bg-stone-900/40 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-sm">
          No bookings match the search criteria.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 overflow-hidden shadow-sm backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-stone-300">
              <thead className="bg-slate-50 dark:bg-stone-950 uppercase tracking-wider text-[11px] text-slate-500 dark:text-stone-400 border-b border-slate-200 dark:border-stone-800">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Stay</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-stone-800/80">
                {bookings.map((b) => {
                  const guest = typeof b.guestId === 'object' ? b.guestId : null;
                  const roomType = typeof b.roomTypeId === 'object' ? b.roomTypeId : null;

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/80 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#487FFF]">
                        {b.bookingReference}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-stone-100">
                          {guest?.fullName || 'Guest'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-stone-400">{guest?.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-stone-200">{formatDisplayDate(b.checkInDate)}</div>
                        <div className="text-[11px] text-slate-500 dark:text-stone-400">
                          to {formatDisplayDate(b.checkOutDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-stone-200">
                        {roomType?.name || 'Deluxe Room'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-stone-100">
                        {formatCurrency(b.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.reservationStatus} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.stayStatus} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-stone-300 hover:text-[#487FFF] hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setQrModalBooking(b)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-stone-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
                            title="View Scannable QR Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {b.reservationStatus === 'CONFIRMED' && b.stayStatus === 'NOT_CHECKED_IN' && (
                            <button
                              onClick={() => setCheckInBooking(b)}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                              title="Check-In Guest Now"
                            >
                              <DoorOpen className="w-4 h-4" />
                            </button>
                          )}

                          {b.reservationStatus !== 'CANCELLED' && b.stayStatus === 'NOT_CHECKED_IN' && (
                            <button
                              onClick={() => setCancelModalBooking(b)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scannable QR Pass Modal */}
      {qrModalBooking && (
        <Modal
          isOpen={Boolean(qrModalBooking)}
          onClose={() => setQrModalBooking(null)}
          title={`Digital Check-In QR Pass: ${qrModalBooking.bookingReference}`}
        >
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-600 dark:text-stone-300">
              Scan this QR code with any smartphone camera to open the instant mobile self-registration form.
            </p>

            <div className="flex justify-center py-2">
              <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-[#487FFF] inline-block">
                <QRCodeSVG
                  value={`${qrHostOrigin.replace(/\/$/, '')}/guest-registration/${qrModalBooking.bookingReference}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-[#EAECF0] dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-mono truncate">
              {`${qrHostOrigin.replace(/\/$/, '')}/guest-registration/${qrModalBooking.bookingReference}`}
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-700 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Guest:</span>
                <span className="font-semibold text-[#1E293B] dark:text-white">
                  {typeof qrModalBooking.guestId === 'object' ? qrModalBooking.guestId?.fullName : 'Guest'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Check-In:</span>
                <span className="font-semibold text-[#1E293B] dark:text-white">
                  {formatDisplayDate(qrModalBooking.checkInDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Billed:</span>
                <span className="font-bold text-[#487FFF]">
                  {formatCurrency(qrModalBooking.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                leftIcon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${qrHostOrigin.replace(/\/$/, '')}/guest-registration/${qrModalBooking.bookingReference}`
                  );
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
              >
                {copiedLink ? 'Copied Link!' : 'Copy Form Link'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => {
                  window.open(
                    `${qrHostOrigin.replace(/\/$/, '')}/guest-registration/${qrModalBooking.bookingReference}`,
                    '_blank'
                  );
                }}
              >
                Open Form
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <Modal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Details: ${selectedBooking.bookingReference}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-slate-700 dark:text-stone-300">
            <div className="flex items-center gap-3">
              <StatusBadge status={selectedBooking.reservationStatus} size="md" />
              <StatusBadge status={selectedBooking.paymentStatus} size="md" />
              <StatusBadge status={selectedBooking.stayStatus} size="md" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800">
              <div>
                <span className="text-slate-500 dark:text-stone-500 block mb-0.5">Guest Name</span>
                <span className="text-slate-900 dark:text-stone-100 font-semibold">
                  {typeof selectedBooking.guestId === 'object'
                    ? selectedBooking.guestId?.fullName
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-stone-500 block mb-0.5">Email</span>
                <span className="text-slate-900 dark:text-stone-100 font-semibold">
                  {typeof selectedBooking.guestId === 'object'
                    ? selectedBooking.guestId?.email
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-stone-500 block mb-0.5">Mobile</span>
                <span className="text-slate-900 dark:text-stone-100 font-semibold">
                  {typeof selectedBooking.guestId === 'object'
                    ? selectedBooking.guestId?.mobile
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-stone-500 block mb-0.5">Check-in</span>
                <span className="text-slate-900 dark:text-stone-100 font-semibold">
                  {formatDisplayDate(selectedBooking.checkInDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-stone-500 block mb-0.5">Check-out</span>
                <span className="text-slate-900 dark:text-stone-100 font-semibold">
                  {formatDisplayDate(selectedBooking.checkOutDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-stone-500 block mb-0.5">Guests</span>
                <span className="text-slate-900 dark:text-stone-100 font-semibold">
                  {selectedBooking.numberOfGuests} Guests
                </span>
              </div>
            </div>

            {/* Pricing Snapshot */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#487FFF] block mb-2">
                Historical Pricing Snapshot (Immutable)
              </span>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-stone-400">Total Billed Amount:</span>
                <span className="font-bold text-[#487FFF] text-sm">
                  {formatCurrency(selectedBooking.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-stone-400">Booking Channel / Source:</span>
                <span className="uppercase text-slate-800 dark:text-stone-200">{selectedBooking.source}</span>
              </div>
              {selectedBooking.specialRequests && (
                <div className="pt-2 border-t border-slate-200 dark:border-stone-800">
                  <span className="text-slate-600 dark:text-stone-400 block mb-1">Special Requests:</span>
                  <span className="text-slate-700 dark:text-stone-300 italic">{selectedBooking.specialRequests}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {cancelModalBooking && (
        <Modal
          isOpen={Boolean(cancelModalBooking)}
          onClose={() => setCancelModalBooking(null)}
          title={`Cancel Booking: ${cancelModalBooking.bookingReference}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-stone-300">
              Cancelling this reservation will release the locked room back to the hotel's live
              inventory immediately.
            </p>

            <Input
              label="Cancellation Reason"
              placeholder="e.g. Guest requested over phone / No show"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="ghost" size="sm" onClick={() => setCancelModalBooking(null)}>
                Dismiss
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isCancelling}
                onClick={handleCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Check-In Modal */}
      {checkInBooking && (
        <Modal
          isOpen={Boolean(checkInBooking)}
          onClose={() => setCheckInBooking(null)}
          title={`Front Desk Check-In: ${checkInBooking.bookingReference}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-stone-300">
              Confirm guest arrival for{' '}
              <strong className="text-slate-900 dark:text-stone-100">
                {typeof checkInBooking.guestId === 'object'
                  ? checkInBooking.guestId?.fullName
                  : 'Guest'}
              </strong>
              . This issues the room key and activates the stay folio in the PMS.
            </p>

            <Input
              label="Security Deposit Collected (₹)"
              type="number"
              min="0"
              value={checkInDeposit}
              onChange={(e) => setCheckInDeposit(Number(e.target.value))}
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setCheckInBooking(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isCheckingIn}
                onClick={handleQuickCheckIn}
                leftIcon={<DoorOpen className="w-4 h-4" />}
              >
                Complete Check-In & Issue Key
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Reservation Modal (Calendar / Next Day Booking) */}
      <NewBookingModal
        isOpen={showNewBookingModal}
        onClose={() => setShowNewBookingModal(false)}
        onSuccess={(msg) => {
          setSuccessToast(msg);
          refetch();
        }}
      />
    </div>
  );
};

