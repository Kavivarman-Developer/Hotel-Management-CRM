import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Shield, Download, RefreshCw } from 'lucide-react';
import {
  useGetOccupancyReportQuery,
  useGetRevenueReportQuery,
  useGetAuditLogsQuery,
} from '../dashboardApi';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { formatCurrency } from '@/utils/formatters';

export const AdminReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REVENUE' | 'OCCUPANCY' | 'AUDIT'>('REVENUE');

  const {
    data: revenueResponse,
    isLoading: isRevLoading,
    isError: isRevError,
    refetch: refetchRev,
  } = useGetRevenueReportQuery({});

  const {
    data: occResponse,
    isLoading: isOccLoading,
    isError: isOccError,
    refetch: refetchOcc,
  } = useGetOccupancyReportQuery({});

  const {
    data: auditResponse,
    isLoading: isAuditLoading,
    isError: isAuditError,
    refetch: refetchAudit,
  } = useGetAuditLogsQuery({ limit: 20 });

  const revenueData = revenueResponse?.data;
  const occupancyData = occResponse?.data;
  const auditLogs = auditResponse?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financials & Compliance"
        title="Reports & Audit Intelligence"
        subtitle="Historical financial analytics, occupancy rates, ADR & RevPAR indices, and immutable security audit logs."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export PDF / Print
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl shadow-xs gap-1 w-fit">
        <button
          onClick={() => setActiveTab('REVENUE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'REVENUE'
              ? 'bg-[#487FFF] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Revenue & Tax Breakdown
        </button>
        <button
          onClick={() => setActiveTab('OCCUPANCY')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'OCCUPANCY'
              ? 'bg-[#487FFF] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Occupancy & RevPAR Analytics
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'AUDIT'
              ? 'bg-[#487FFF] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          System Audit Logs
        </button>
      </div>

      {/* Revenue Tab */}
      {activeTab === 'REVENUE' && (
        <div className="space-y-6">
          {isRevLoading ? (
            <LoadingSpinner size="lg" message="Computing revenue reports..." fullPage />
          ) : isRevError ? (
            <ErrorMessage title="Revenue Error" message="Could not load revenue report" onRetry={refetchRev} />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
                  <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Total Billed Revenue</span>
                  <div className="font-sans text-2xl font-bold text-[#487FFF] mt-2">
                    {formatCurrency(revenueData?.totalRevenuePaise || 0)}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Direct bookings + Walk-ins</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
                  <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">GST Collected</span>
                  <div className="font-sans text-2xl font-bold text-[#1E293B] dark:text-white mt-2">
                    {formatCurrency(revenueData?.totalTaxesPaise || 0)}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Tax liability for filing</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-slate-800 shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
                  <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Total Reservations</span>
                  <div className="font-sans text-2xl font-bold text-[#10B981] mt-2">
                    {revenueData?.confirmedBookingsCount || 0}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Confirmed stays</p>
                </div>
              </div>

              {/* Breakdown by room category if available */}
              <div className="rounded-2xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-6 shadow-sm backdrop-blur-md">
                <h3 className="font-serif text-base font-bold text-slate-900 dark:text-stone-100 mb-4">
                  Financial Integrity Overview
                </h3>
                <p className="text-xs text-slate-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                  All historical booking amounts are recorded with immutable pricing snapshots in integer paise
                  to ensure historical accounting reconciliation remains strictly tamper-proof regardless of subsequent
                  rate plan updates.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Occupancy Tab */}
      {activeTab === 'OCCUPANCY' && (
        <div className="space-y-6">
          {isOccLoading ? (
            <LoadingSpinner size="lg" message="Loading occupancy data..." fullPage />
          ) : isOccError ? (
            <ErrorMessage title="Occupancy Error" message="Could not load occupancy metrics" onRetry={refetchOcc} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-slate-200 dark:border-stone-800 shadow-sm">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-stone-400">Occupancy Rate</span>
                <div className="font-serif text-3xl font-bold text-[#487FFF] mt-2">
                  {occupancyData?.occupancyRate || 0}%
                </div>
                <p className="text-[11px] text-slate-500 dark:text-stone-500 mt-1">Percentage of active rooms occupied</p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-slate-200 dark:border-stone-800 shadow-sm">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-stone-400">Total Room Inventory</span>
                <div className="font-serif text-3xl font-bold text-slate-900 dark:text-stone-100 mt-2">
                  {occupancyData?.totalRooms || 0}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-stone-500 mt-1">Active operational rooms</p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-slate-200 dark:border-stone-800 shadow-sm">
                <span className="text-xs uppercase font-semibold text-slate-500 dark:text-stone-400">Under Maintenance</span>
                <div className="font-serif text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                  {occupancyData?.maintenanceRooms || 0}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-stone-500 mt-1">Blocked physical units</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          {isAuditLoading ? (
            <LoadingSpinner size="lg" message="Loading security audit trail..." fullPage />
          ) : isAuditError ? (
            <ErrorMessage title="Audit Trail Error" message="Could not load audit logs" onRetry={refetchAudit} />
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 overflow-hidden shadow-sm backdrop-blur-md">
              <div className="p-4 border-b border-slate-200 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-stone-200">Security Audit Trail (Latest 20)</span>
                <Button variant="ghost" size="sm" onClick={() => refetchAudit()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                  Refresh
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-stone-300">
                  <thead className="bg-slate-50 dark:bg-stone-950 uppercase tracking-wider text-[11px] text-slate-500 dark:text-stone-400 border-b border-slate-200 dark:border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800/80">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-stone-500">
                          No audit entries logged yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log: any) => (
                        <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-stone-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#487FFF]">{log.action}</td>
                          <td className="py-3 px-4">{log.entityType} ({log.entityId?.slice(0, 8)}...)</td>
                          <td className="py-3 px-4 text-slate-900 dark:text-stone-200">{log.userId?.name || log.userId || 'System'}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-stone-400">{log.ipAddress || '127.0.0.1'}</td>
                          <td className="py-3 px-4 text-slate-500 dark:text-stone-400">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
