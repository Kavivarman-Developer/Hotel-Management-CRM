import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Percent,
  DollarSign,
  Calendar,
  AlertCircle,
  Copy,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  useGetVouchersQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
  Voucher,
} from '../vouchersApi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, rupeesToPaise } from '@/utils/formatters';
import { formatDisplayDate, getDefaultCheckIn, addDays } from '@/utils/dates';

export const AdminVouchersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minBookingAmountRupees, setMinBookingAmountRupees] = useState<number>(1000);
  const [maxDiscountAmountRupees, setMaxDiscountAmountRupees] = useState<number>(1000);
  const [validUntilDate, setValidUntilDate] = useState(addDays(getDefaultCheckIn(), 90));
  const [usageLimit, setUsageLimit] = useState<number>(500);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: vouchersRes,
    isLoading,
    isError,
    refetch,
  } = useGetVouchersQuery({
    search: searchTerm || undefined,
    isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
  });

  const [createVoucher, { isLoading: isCreating }] = useCreateVoucherMutation();
  const [updateVoucher] = useUpdateVoucherMutation();
  const [deleteVoucher] = useDeleteVoucherMutation();

  const vouchers = vouchersRes?.data || [];
  const stats = (vouchersRes as any)?.pagination?.stats || {
    totalVouchers: vouchers.length,
    activeVouchers: vouchers.filter((v: Voucher) => v.isActive).length,
    totalRedemptions: vouchers.reduce((acc: number, v: Voucher) => acc + (v.timesUsed || 0), 0),
  };

  const handleCopy = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (v: Voucher) => {
    try {
      await updateVoucher({
        id: v._id,
        body: { isActive: !v.isActive },
      }).unwrap();
      setSuccessToast(`Voucher ${v.code} is now ${!v.isActive ? 'Active' : 'Inactive'}`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to update voucher status');
    }
  };

  const handleDelete = async (v: Voucher) => {
    if (!window.confirm(`Are you sure you want to delete voucher ${v.code}?`)) return;
    try {
      await deleteVoucher(v._id).unwrap();
      setSuccessToast(`Voucher ${v.code} deleted successfully`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to delete voucher');
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim()) {
      setFormError('Voucher code is required');
      return;
    }

    try {
      await createVoucher({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: discountType === 'PERCENTAGE' ? discountValue : rupeesToPaise(discountValue),
        minBookingAmount: rupeesToPaise(minBookingAmountRupees),
        maxDiscountAmount:
          discountType === 'PERCENTAGE' && maxDiscountAmountRupees
            ? rupeesToPaise(maxDiscountAmountRupees)
            : undefined,
        validUntil: validUntilDate,
        usageLimit,
        isActive: true,
      }).unwrap();

      setShowCreateModal(false);
      setCode('');
      setDescription('');
      setSuccessToast(`Voucher ${code.toUpperCase()} created successfully!`);
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.error?.message || 'Failed to create voucher');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business Operations"
        title="Vouchers & Promotional Discounts"
        subtitle="Create promo codes, define discount percentages or flat rupee deductions, configure usage limits, and track campaign redemptions."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create New Voucher
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
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* KPI Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Active Vouchers */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">Active Vouchers</span>
            <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-[#487FFF] shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1E293B] dark:text-white tracking-tight flex items-baseline gap-1.5">
              <span>{stats.activeVouchers}</span>
              <span className="text-xs text-[#94A3B8] dark:text-slate-400 font-medium">/ {stats.totalVouchers} total</span>
            </div>
            <div className="flex items-center mt-2 text-xs text-[#94A3B8] dark:text-slate-400">
              <span className="text-[#10B981] font-semibold mr-1">Live</span> coupons ready for checkout
            </div>
          </div>
        </div>

        {/* Card 2: Total Redemptions */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">Total Redemptions</span>
            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-[#10B981] shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#1E293B] dark:text-white tracking-tight">
              {stats.totalRedemptions}
            </div>
            <div className="flex items-center mt-2 text-xs text-[#94A3B8] dark:text-slate-400">
              <span>Bookings discounted via promo codes</span>
            </div>
          </div>
        </div>

        {/* Card 3: Campaigns Active */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">Primary Campaign</span>
            <div className="w-11 h-11 rounded-full bg-purple-50 dark:bg-purple-950/80 flex items-center justify-center text-[#8B5CF6] shadow-xs">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-[#8B5CF6] tracking-tight truncate">
              Direct Booking Boost
            </div>
            <div className="flex items-center mt-2 text-xs text-[#94A3B8] dark:text-slate-400">
              <span>Drive direct online reservations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Segmented Pill Tabs */}
        <div className="flex items-center p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl shadow-xs gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Vouchers
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active Only
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'INACTIVE'
                ? 'bg-[#487FFF] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-[#EAECF0] dark:border-slate-700 text-[#1E293B] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#487FFF] shadow-xs transition-colors"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading vouchers..." />
      ) : isError ? (
        <ErrorMessage
          title="Error loading vouchers"
          message="Could not load promotional vouchers from the database."
          onRetry={refetch}
        />
      ) : vouchers.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#EAECF0] dark:border-slate-800 p-12 text-center shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] flex items-center justify-center mx-auto shadow-xs">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#1E293B] dark:text-white">No Vouchers Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Create promotional discount codes for direct guest reservations and special offers.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create First Voucher
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] dark:bg-slate-900/60 border-b border-[#EAECF0] dark:border-slate-800 text-[#94A3B8] dark:text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Voucher Code</th>
                  <th className="py-3.5 px-4">Offer Details</th>
                  <th className="py-3.5 px-4">Discount Value</th>
                  <th className="py-3.5 px-4">Min Spend / Cap</th>
                  <th className="py-3.5 px-4">Usage / Limit</th>
                  <th className="py-3.5 px-4">Valid Until</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] dark:divide-slate-800">
                {vouchers.map((v: Voucher) => (
                  <tr key={v._id} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-900 text-[#487FFF]">
                          {v.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(v.code)}
                          title="Copy voucher code"
                          className="text-slate-400 hover:text-[#487FFF] transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copiedCode === v.code && (
                          <span className="text-[10px] text-[#10B981] font-bold">Copied!</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-[#1E293B] dark:text-white truncate">
                        {v.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#10B981] text-xs font-mono">
                      {v.discountType === 'PERCENTAGE'
                        ? `${v.discountValue}% OFF`
                        : `${formatCurrency(v.discountValue)} OFF`}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>Min: {v.minBookingAmount ? formatCurrency(v.minBookingAmount) : 'None'}</div>
                      {v.maxDiscountAmount ? (
                        <div className="text-[10px] text-slate-400">
                          Cap: {formatCurrency(v.maxDiscountAmount)}
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-[#1E293B] dark:text-white">
                        {v.timesUsed} / {v.usageLimit}
                      </div>
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-[#487FFF] h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, ((v.timesUsed || 0) / v.usageLimit) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {formatDisplayDate(v.validUntil.split('T')[0])}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(v)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                          v.isActive
                            ? 'bg-emerald-50 text-[#10B981] border border-emerald-200/50 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {v.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(v)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Voucher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Voucher Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Promotional Voucher"
        >
          <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
            {formError && <ErrorMessage title="Voucher Error" message={formError} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Voucher Code *"
                placeholder="e.g. SUMMER2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-300 mb-1">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('PERCENTAGE');
                      setDiscountValue(10);
                    }}
                    className={`p-2 rounded-xl border text-center font-bold transition-all text-xs ${
                      discountType === 'PERCENTAGE'
                        ? 'bg-blue-50 dark:bg-blue-950/80 border-[#487FFF] text-[#487FFF]'
                        : 'bg-white dark:bg-slate-800 border-[#EAECF0] dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('FIXED_AMOUNT');
                      setDiscountValue(500);
                    }}
                    className={`p-2 rounded-xl border text-center font-bold transition-all text-xs ${
                      discountType === 'FIXED_AMOUNT'
                        ? 'bg-blue-50 dark:bg-blue-950/80 border-[#487FFF] text-[#487FFF]'
                        : 'bg-white dark:bg-slate-800 border-[#EAECF0] dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Flat Rupee (₹)
                  </button>
                </div>
              </div>
            </div>

            <Input
              label="Campaign Description *"
              placeholder="e.g. 15% off for direct website guests"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label={discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                type="number"
                min="1"
                max={discountType === 'PERCENTAGE' ? 100 : 50000}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                required
              />

              <Input
                label="Min Booking Subtotal (₹)"
                type="number"
                min="0"
                value={minBookingAmountRupees}
                onChange={(e) => setMinBookingAmountRupees(Number(e.target.value))}
              />

              {discountType === 'PERCENTAGE' ? (
                <Input
                  label="Max Discount Cap (₹)"
                  type="number"
                  min="0"
                  value={maxDiscountAmountRupees}
                  onChange={(e) => setMaxDiscountAmountRupees(Number(e.target.value))}
                />
              ) : (
                <Input
                  label="Usage Limit (Count)"
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-300 mb-1">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  value={validUntilDate}
                  min={getDefaultCheckIn()}
                  onChange={(e) => setValidUntilDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#EAECF0] dark:border-slate-700 text-xs font-semibold text-[#1E293B] dark:text-white outline-none focus:border-[#487FFF]"
                />
              </div>

              {discountType === 'PERCENTAGE' && (
                <Input
                  label="Usage Limit (Count)"
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                />
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isCreating}>
                Create Voucher
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
