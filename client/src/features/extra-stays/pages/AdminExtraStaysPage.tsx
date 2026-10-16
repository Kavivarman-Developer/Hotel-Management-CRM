import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Phone,
  DoorOpen,
  Calendar,
  Wallet,
  ShieldCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  useGetAdminExtraStaysQuery,
  useApproveExtraStayMutation,
  useRejectExtraStayMutation,
  ExtraStayRequest,
} from '../extraStaysApi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency } from '@/utils/formatters';

type TabType = 'PENDING' | 'APPROVED' | 'ALL';

export const AdminExtraStaysPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectModalRequest, setRejectModalRequest] = useState<ExtraStayRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Room is reserved for incoming guest today.');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const {
    data: requestsRes,
    isLoading,
    isError,
    refetch,
  } = useGetAdminExtraStaysQuery(
    {
      status: activeTab === 'ALL' ? undefined : activeTab,
      search: searchTerm || undefined,
    },
    { pollingInterval: 10000 }
  );

  const [approveRequest, { isLoading: isApproving }] = useApproveExtraStayMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectExtraStayMutation();

  const requests = requestsRes?.data || [];
  const stats = (requestsRes as any)?.pagination?.stats || {
    pending: requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
    totalRevenuePaise: requests
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + (r.chargeAmountPaise || 0), 0),
  };

  const handleApprove = async (req: ExtraStayRequest, addToFolio = true) => {
    try {
      await approveRequest({
        id: req._id,
        body: {
          addToFolio,
          staffNotes: 'Approved by front desk. Extension logged to guest folio.',
        },
      }).unwrap();

      setSuccessToast(
        `Approved +${req.requestedExtraHours} hrs extension for Room ${req.roomNumber}. Folio updated.`
      );
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to approve request');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalRequest) return;
    try {
      await rejectRequest({
        id: rejectModalRequest._id,
        body: { rejectionReason },
      }).unwrap();

      const room = rejectModalRequest.roomNumber;
      setRejectModalRequest(null);
      setSuccessToast(`Extension request for Room ${room} declined.`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to decline request');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Guest Extension Management"
        title="Customer Extra Stays & Late Check-Outs"
        subtitle="Review real-time guest requests to extend room checkout hours, assess room turnaround availability, and automatically append hourly charges to active folios."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Requests
          </Button>
        }
      />

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Pending */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">Pending Requests</span>
            <div className="w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center text-[#FF9F43] shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1E293B] dark:text-white tracking-tight flex items-center gap-2">
              <span>{stats.pending}</span>
              {stats.pending > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-[#FF9F43] font-bold border border-amber-200/50 dark:border-amber-800 animate-pulse">
                  Needs Review
                </span>
              )}
            </div>
            <div className="flex items-center mt-2 text-xs text-[#94A3B8] dark:text-slate-400">
              <span>Awaiting front desk approval</span>
            </div>
          </div>
        </div>

        {/* Card 2: Approved Extensions */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">Approved Extensions</span>
            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-[#10B981] shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1E293B] dark:text-white tracking-tight">
              {stats.approved}
            </div>
            <div className="flex items-center mt-2 text-xs text-[#94A3B8] dark:text-slate-400">
              <span className="text-[#10B981] font-semibold mr-1">Completed</span> extensions granted
            </div>
          </div>
        </div>

        {/* Card 3: Extra Revenue */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">Extra Extension Revenue</span>
            <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-[#487FFF] shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1E293B] dark:text-white tracking-tight">
              {formatCurrency(stats.totalRevenuePaise)}
            </div>
            <div className="flex items-center mt-2 text-xs text-[#94A3B8] dark:text-slate-400">
              <span>Billed directly to guest folios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Segmented Pill Tabs */}
        <div className="flex items-center p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'PENDING'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Pending Review</span>
            {stats.pending > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'PENDING'
                    ? 'bg-white text-[#487FFF]'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {stats.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'APPROVED'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Approved</span>
            <span className="opacity-80 text-[11px]">({stats.approved})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Requests
          </button>
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search room, guest name, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-[#EAECF0] dark:border-slate-700 text-[#1E293B] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#487FFF] shadow-xs transition-colors"
          />
        </div>
      </div>

      {/* Requests Content Table / Empty State */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading extra stay requests..." />
      ) : isError ? (
        <ErrorMessage
          title="Error loading requests"
          message="Could not load extra stay requests from the database."
          onRetry={refetch}
        />
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#EAECF0] dark:border-slate-800 p-12 text-center shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#1E293B] dark:text-white">
              {activeTab === 'PENDING'
                ? 'No Pending Extension Requests'
                : 'No Extra Stay Requests Recorded'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              When in-house guests submit additional stay hours from their digital pass, they will update here in real-time.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] dark:bg-slate-900/60 border-b border-[#EAECF0] dark:border-slate-800 text-[#94A3B8] dark:text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Room & Guest</th>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Extension</th>
                  <th className="py-3.5 px-4">New Checkout</th>
                  <th className="py-3.5 px-4">Guest Reason</th>
                  <th className="py-3.5 px-4">Extra Charge</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] dark:divide-slate-800">
                {requests.map((r: ExtraStayRequest) => {
                  const isPending = r.status === 'PENDING';

                  return (
                    <tr
                      key={r._id}
                      className={`hover:bg-[#F8F9FA] dark:hover:bg-slate-800/50 transition-colors ${
                        isPending ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] border border-blue-100 dark:border-blue-900 font-bold font-mono text-xs">
                            Room {r.roomNumber}
                          </span>
                          <div>
                            <div className="font-bold text-[#1E293B] dark:text-white">
                              {r.guestName}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{r.guestMobile}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#487FFF]">
                        {r.bookingReference}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] font-bold text-[11px] border border-blue-200/50 dark:border-blue-900">
                          +{r.requestedExtraHours} Hours
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1E293B] dark:text-white">
                          {r.newExpectedCheckOutTime}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          From standard 11:00 AM
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="italic text-slate-600 dark:text-slate-300 truncate" title={r.reason}>
                          "{r.reason}"
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#1E293B] dark:text-white font-mono text-sm">
                        {formatCurrency(r.chargeAmountPaise)}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={isApproving}
                              onClick={() => handleApprove(r, true)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Approve
                            </Button>
                            <button
                              type="button"
                              onClick={() => setRejectModalRequest(r)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">
                            {r.status === 'APPROVED'
                              ? `Billed to Folio`
                              : `Declined: ${r.rejectionReason || 'Unavailable'}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {rejectModalRequest && (
        <Modal
          isOpen={Boolean(rejectModalRequest)}
          onClose={() => setRejectModalRequest(null)}
          title={`Decline Extension: Room ${rejectModalRequest.roomNumber}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Provide a reason to notify guest <strong>{rejectModalRequest.guestName}</strong> why their
              extension cannot be accepted:
            </p>

            <Input
              label="Decline Explanation *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setRejectModalRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isRejecting}
                onClick={handleConfirmReject}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
