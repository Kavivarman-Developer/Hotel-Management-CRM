import React, { useState, useMemo } from 'react';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  FileText,
  RefreshCw,
  Printer,
  Search,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Car,
  Calendar,
  Copy,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  useGetAdminRegistrationsQuery,
  useAdminApproveRegistrationMutation,
  useAdminRejectRegistrationMutation,
} from '../dashboardApi';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { GuestRegistrationData } from '@/types';
import { getSuggestedQrOrigin } from '@/utils/network';

export const AdminRegistrationsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCounterQrModal, setShowCounterQrModal] = useState(false);
  const [qrHostOrigin, setQrHostOrigin] = useState<string>('http://192.168.0.106:5173');

  React.useEffect(() => {
    getSuggestedQrOrigin().then((origin) => {
      if (origin) setQrHostOrigin(origin);
    });
  }, []);

  // Fetch all registrations so KPI counters and tab counts are always complete and accurate
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminRegistrationsQuery(
    {},
    { pollingInterval: 15000 }
  );

  const [approveRegistration, { isLoading: isApproving }] =
    useAdminApproveRegistrationMutation();
  const [rejectRegistration, { isLoading: isRejecting }] =
    useAdminRejectRegistrationMutation();

  const [selectedReg, setSelectedReg] = useState<GuestRegistrationData | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('Verified Government ID upon physical check-in');
  const [rejectReason, setRejectReason] = useState<string>('Government ID number mismatch or unreadable image');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const allRegistrations: GuestRegistrationData[] = response?.data || [];

  // KPI Counts
  const pendingCount = useMemo(
    () => allRegistrations.filter((r) => r.verificationStatus === 'PENDING').length,
    [allRegistrations]
  );
  const verifiedCount = useMemo(
    () => allRegistrations.filter((r) => r.verificationStatus === 'VERIFIED').length,
    [allRegistrations]
  );
  const rejectedCount = useMemo(
    () => allRegistrations.filter((r) => r.verificationStatus === 'REJECTED').length,
    [allRegistrations]
  );
  const totalCount = allRegistrations.length;

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return allRegistrations.filter((reg) => {
      // Status filter
      if (statusFilter && reg.verificationStatus !== statusFilter) {
        return false;
      }

      // Search filter
      if (!searchTerm.trim()) return true;
      const search = searchTerm.toLowerCase();
      const guest = reg.registrationDetails?.primaryGuest;
      const fullName = (guest?.fullName || '').toLowerCase();
      const phone = (guest?.phone || '').toLowerCase();
      const email = (guest?.email || '').toLowerCase();
      const idType = (guest?.idProofType || '').toLowerCase();
      const idNumber = (guest?.idProofNumberMasked || '').toLowerCase();
      const vehicle = (reg.registrationDetails?.vehicleNumber || '').toLowerCase();

      return (
        fullName.includes(search) ||
        phone.includes(search) ||
        email.includes(search) ||
        idType.includes(search) ||
        idNumber.includes(search) ||
        vehicle.includes(search)
      );
    });
  }, [allRegistrations, statusFilter, searchTerm]);

  const handleApprove = async (id: string) => {
    try {
      await approveRegistration({ id, notes: reviewNotes }).unwrap();
      setSelectedReg(null);
      setSuccessToast('Guest digital registration approved & identity verified successfully.');
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectRegistration({ id, reason: rejectReason }).unwrap();
      setSelectedReg(null);
      setSuccessToast('Guest digital registration rejected.');
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Rejection failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Front Desk Compliance"
        title="Digital QR Self-Registrations"
        subtitle="Review contactless guest identity registrations submitted via mobile QR codes prior to physical arrival."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCounterQrModal(true)}
              leftIcon={<QrCode className="w-4 h-4" />}
            >
              Counter QR Stand
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {pendingCount} Passes
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> Awaiting Desk Verification
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Verified Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Verified Passes</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {verifiedCount} Verified
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Identity Cleared
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Digital Passes</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalCount} Total
            </div>
            <span className="text-[11px] text-[#487FFF] font-semibold mt-0.5 block">
              Contactless Mobile Stream
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#487FFF] flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        {/* Efficiency / Desk Speed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Express Desk Flow</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Instant
            </div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" /> Zero Wait Arrival
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Modern Filter Tabs & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl overflow-x-auto w-full md:w-auto">
          {[
            { id: 'PENDING', label: 'Pending Review', count: pendingCount },
            { id: 'VERIFIED', label: 'Verified', count: verifiedCount },
            { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
            { id: '', label: 'All Registrations', count: totalCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                statusFilter === tab.id
                  ? 'bg-[#487FFF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  statusFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guest name, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#487FFF]/40 focus:border-[#487FFF]"
          />
        </div>
      </div>

      {/* Registrations Table */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading guest registrations..." fullPage />
      ) : isError ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-4">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {(error as any)?.status === 401
              ? 'Your admin session has expired or requires authentication.'
              : 'Failed to fetch guest registrations from the server.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(error as any)?.status === 401 ? (
              <a
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-[#487FFF] hover:bg-[#3867d6] text-white font-bold text-xs shadow-md transition-colors"
              >
                Log In to Admin Portal
              </a>
            ) : (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No guest registrations found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm
              ? 'No records match your search criteria. Try a different query.'
              : `There are currently no registrations in "${statusFilter || 'ALL'}" status.`}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/80 uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Primary Guest</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                  <th className="py-3.5 px-4 font-semibold">Government ID Proof</th>
                  <th className="py-3.5 px-4 font-semibold">Vehicle & ETA</th>
                  <th className="py-3.5 px-4 font-semibold">Verification</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredRegistrations.map((reg) => {
                  const details = reg.registrationDetails?.primaryGuest;
                  const fullName = details?.fullName || 'Guest Pass';
                  const initials = fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={reg._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Guest Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#487FFF] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
                            {initials || 'G'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {details?.nationality || 'Indian National'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                          <Phone className="w-3 h-3 text-[#487FFF]" />
                          <span>{details?.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">{details?.email || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Government ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {details?.idProofType || 'Government ID'}
                        </div>
                        <div className="font-mono text-[11px] text-[#487FFF] font-semibold">
                          {details?.idProofNumberMasked || '••••••••'}
                        </div>
                      </td>

                      {/* Vehicle & ETA */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span>{reg.registrationDetails?.vehicleNumber || 'No Vehicle'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>ETA: {reg.registrationDetails?.estimatedArrivalTime || '12:00 PM'}</span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={reg.verificationStatus} size="sm" />
                      </td>

                      {/* Review Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReg(reg)}
                          leftIcon={<Eye className="w-3.5 h-3.5 text-[#487FFF]" />}
                        >
                          Review ID
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReg && (
        <Modal
          isOpen={Boolean(selectedReg)}
          onClose={() => setSelectedReg(null)}
          title="Verify Guest Registration & ID Proof"
          maxWidth="xl"
        >
          <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Guest Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedReg.registrationDetails?.primaryGuest?.fullName}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Government ID Type:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedReg.registrationDetails?.primaryGuest?.idProofType}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Masked ID Number:</span>
                <span className="font-mono text-[#487FFF] font-bold">
                  {selectedReg.registrationDetails?.primaryGuest?.idProofNumberMasked}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Contact Phone:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedReg.registrationDetails?.primaryGuest?.phone}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 dark:text-slate-400">Submitted Timestamp:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {new Date(selectedReg.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {selectedReg.verificationStatus === 'PENDING' ? (
              <div className="space-y-4">
                <Input
                  label="Desk Verification Notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified Aadhaar card copy physically at front desk"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isRejecting}
                    onClick={() => handleReject(selectedReg._id)}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject ID
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isApproving}
                    onClick={() => handleApprove(selectedReg._id)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve & Verify Guest
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  This registration has already been verified as{' '}
                  <strong className="text-[#487FFF] font-bold">{selectedReg.verificationStatus}</strong>.
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reception Express Check-in Counter QR Stand Modal */}
      {showCounterQrModal && (
        <Modal
          isOpen={showCounterQrModal}
          onClose={() => setShowCounterQrModal(false)}
          title="Reception Express Check-in QR Stand"
          maxWidth="lg"
        >
          <div className="space-y-6 py-2">
            {/* Network IP / Host Config Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Mobile QR Target URL:
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Wi-Fi LAN Mode Active
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrHostOrigin}
                  onChange={(e) => setQrHostOrigin(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#487FFF]/40 focus:border-[#487FFF]"
                  placeholder="http://192.168.0.106:5173"
                />
                <button
                  type="button"
                  onClick={() => setQrHostOrigin('http://192.168.0.106:5173')}
                  className="px-3 py-1.5 text-[11px] font-semibold bg-[#487FFF] text-white rounded-lg hover:bg-[#3867d6] transition-colors"
                >
                  Reset Wi-Fi IP
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                <strong>Why this is needed:</strong> When guests scan with their smartphones, using your computer's Wi-Fi IP (<code>192.168.0.106:5173</code>) allows their mobile browser to reach this server. Scanning <code>localhost</code> on a phone causes connection refused.
              </p>
            </div>

            {/* Scannable Poster Card */}
            <div className="p-6 bg-white rounded-2xl border-2 border-[#487FFF] shadow-xl max-w-xs mx-auto text-center space-y-3">
              <div className="font-serif font-bold text-base text-slate-900 tracking-wider">
                GRAND RESIDENCY
              </div>
              <p className="text-[11px] font-bold text-[#487FFF] uppercase tracking-wider">
                Contactless Express Registration
              </p>
              <div className="p-3 bg-slate-50 rounded-xl inline-block border border-slate-200 shadow-inner">
                <QRCodeSVG
                  value={`${qrHostOrigin.replace(/\/$/, '')}/guest-registration/counter-walkin`}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Scan with your smartphone camera to submit ID & verify room check-in instantly
              </p>
              <div className="pt-1 font-mono text-[10px] text-slate-400 truncate max-w-full">
                {`${qrHostOrigin.replace(/\/$/, '')}/guest-registration/counter-walkin`}
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Counter Poster
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${qrHostOrigin.replace(/\/$/, '')}/guest-registration/counter-walkin`
                  );
                  alert('Copied reachable registration URL to clipboard!');
                }}
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Copy Registration URL
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
