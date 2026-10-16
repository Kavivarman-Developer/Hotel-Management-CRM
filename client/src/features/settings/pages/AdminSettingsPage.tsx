import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import {
  ShieldCheck,
  Users,
  Settings as SettingsIcon,
  CheckCircle2,
  Lock,
  Building2,
  Clock,
  Search,
  AlertCircle,
  Save,
  ChevronRight,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetPermissionsMetadataQuery,
  useUpdateRolePermissionsMutation,
  useUpdateStaffPermissionsMutation,
  StaffUserSummary,
  PermissionCategory,
} from '../settingsApi';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { paiseToRupees, rupeesToPaise } from '@/utils/formatters';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const canManageSettings =
    user?.role === 'SUPER_ADMIN' ||
    Boolean(user?.permissions?.includes('permissions.manage' as any)) ||
    Boolean(user?.permissions?.includes('settings.manage' as any));

  const [activeTab, setActiveTab] = useState<'ROLES' | 'STAFF_INDIVIDUAL' | 'PROPERTY'>('ROLES');

  // Metadata & Role Permissions API (skip if unauthorized to avoid 403 error)
  const {
    data: metadataRes,
    isLoading: isMetadataLoading,
    isError: isMetadataError,
    refetch: refetchMetadata,
  } = useGetPermissionsMetadataQuery(undefined, { skip: !canManageSettings });

  // Property Settings API (skip if unauthorized to avoid 403 error)
  const {
    data: settingsRes,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    refetch: refetchSettings,
  } = useGetSettingsQuery(undefined, { skip: !canManageSettings });

  const [updateRolePermissions, { isLoading: isUpdatingRole }] = useUpdateRolePermissionsMutation();
  const [updateStaffPermissions, { isLoading: isUpdatingStaff }] = useUpdateStaffPermissionsMutation();
  const [updateSettings, { isLoading: isUpdatingSettings }] = useUpdateSettingsMutation();

  // Toast state
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // --- Role Access Matrix State ---
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'FRONT_DESK'>('FRONT_DESK');
  const [rolePermissionsState, setRolePermissionsState] = useState<Record<string, string[]>>({
    MANAGER: [],
    FRONT_DESK: [],
  });
  const [applyToExistingStaff, setApplyToExistingStaff] = useState<boolean>(true);

  // Sync role permissions from backend when loaded
  useEffect(() => {
    if (metadataRes?.data?.rolePermissions) {
      setRolePermissionsState({
        MANAGER: metadataRes.data.rolePermissions.MANAGER || [],
        FRONT_DESK: metadataRes.data.rolePermissions.FRONT_DESK || [],
      });
    }
  }, [metadataRes]);

  // --- Individual Staff Permissions Modal State ---
  const [editingStaff, setEditingStaff] = useState<StaffUserSummary | null>(null);
  const [staffPermissionsDraft, setStaffPermissionsDraft] = useState<string[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL' | 'MANAGER' | 'FRONT_DESK'>('ALL');

  // --- Property Settings Form State ---
  const [propForm, setPropForm] = useState({
    propertyName: '',
    tagline: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    email: '',
    checkInTime: '12:00',
    checkOutTime: '11:00',
    defaultGstPercentage: 12,
    holdDurationMinutes: 15,
    cancellationGraceHours: 24,
    allowSameDayBooking: true,
    extraStayHourlyRateRupees: 200,
  });

  useEffect(() => {
    if (settingsRes?.data?.settings) {
      const s = settingsRes.data.settings;
      setPropForm({
        propertyName: s.propertyName || 'GRAND OMR RESIDENCY',
        tagline: s.tagline || '',
        address: s.address || '',
        city: s.city || 'Chennai',
        state: s.state || 'Tamil Nadu',
        pincode: s.pincode || '600130',
        country: s.country || 'India',
        phone: s.phone || '+91 8110018708',
        email: s.email || 'reservations@grandomrresidency.com',
        checkInTime: s.checkInTime || '12:00',
        checkOutTime: s.checkOutTime || '11:00',
        defaultGstPercentage: s.defaultGstPercentage ?? 12,
        holdDurationMinutes: s.holdDurationMinutes ?? 15,
        cancellationGraceHours: s.cancellationGraceHours ?? 24,
        allowSameDayBooking: s.allowSameDayBooking ?? true,
        extraStayHourlyRateRupees: s.extraStayHourlyRatePaise
          ? paiseToRupees(s.extraStayHourlyRatePaise)
          : 200,
      });
    }
  }, [settingsRes]);

  const catalog = metadataRes?.data?.catalog || [];
  const staffUsers = metadataRes?.data?.staffUsers || [];

  const showToast = (msg: string, isErr = false) => {
    if (isErr) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 5000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  const isRolePermissionChecked = (permId: string) => {
    const list = rolePermissionsState[selectedRole] || [];
    return list.includes(permId);
  };

  const handleToggleRolePermission = (permId: string) => {
    const current = rolePermissionsState[selectedRole] || [];
    let updated: string[];
    if (current.includes(permId)) {
      updated = current.filter((id) => id !== permId);
    } else {
      updated = [...current, permId];
    }
    setRolePermissionsState((prev) => ({
      ...prev,
      [selectedRole]: updated,
    }));
  };

  const handleSelectAllForCategory = (cat: PermissionCategory) => {
    const catPermIds = cat.permissions.map((p) => p.id);
    const current = rolePermissionsState[selectedRole] || [];
    const allChecked = catPermIds.every((id) => current.includes(id));

    let updated: string[];
    if (allChecked) {
      updated = current.filter((id) => !catPermIds.includes(id));
    } else {
      const toAdd = catPermIds.filter((id) => !current.includes(id));
      updated = [...current, ...toAdd];
    }

    setRolePermissionsState((prev) => ({
      ...prev,
      [selectedRole]: updated,
    }));
  };

  const handleSaveRolePermissions = async () => {
    try {
      const perms = rolePermissionsState[selectedRole] || [];
      const res = await updateRolePermissions({
        role: selectedRole,
        permissions: perms,
        applyToExistingUsers: applyToExistingStaff,
      }).unwrap();

      showToast(
        res?.message ||
          `Permissions for ${selectedRole === 'MANAGER' ? 'Managers' : 'Front Desk Staff'} updated successfully!`
      );
      refetchMetadata();
    } catch (err: any) {
      showToast(err?.data?.error?.message || 'Failed to update role permissions', true);
    }
  };

  const handleOpenStaffEditor = (staff: StaffUserSummary) => {
    setEditingStaff(staff);
    setStaffPermissionsDraft([...(staff.permissions || [])]);
  };

  const handleToggleStaffDraftPermission = (permId: string) => {
    if (!staffPermissionsDraft.includes(permId)) {
      setStaffPermissionsDraft([...staffPermissionsDraft, permId]);
    } else {
      setStaffPermissionsDraft(staffPermissionsDraft.filter((p) => p !== permId));
    }
  };

  const handleSaveStaffIndividual = async () => {
    if (!editingStaff) return;
    try {
      await updateStaffPermissions({
        id: editingStaff.id,
        permissions: staffPermissionsDraft,
      }).unwrap();

      showToast(`Access permissions updated for ${editingStaff.name}!`);
      setEditingStaff(null);
      refetchMetadata();
    } catch (err: any) {
      showToast(err?.data?.error?.message || 'Failed to update staff permissions', true);
    }
  };

  const handleSavePropertySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        propertyName: propForm.propertyName,
        tagline: propForm.tagline,
        address: propForm.address,
        city: propForm.city,
        state: propForm.state,
        pincode: propForm.pincode,
        country: propForm.country,
        phone: propForm.phone,
        email: propForm.email,
        checkInTime: propForm.checkInTime,
        checkOutTime: propForm.checkOutTime,
        defaultGstPercentage: Number(propForm.defaultGstPercentage),
        holdDurationMinutes: Number(propForm.holdDurationMinutes),
        cancellationGraceHours: Number(propForm.cancellationGraceHours),
        allowSameDayBooking: propForm.allowSameDayBooking,
        extraStayHourlyRatePaise: rupeesToPaise(Number(propForm.extraStayHourlyRateRupees)),
      }).unwrap();

      showToast('Hotel operational settings updated successfully!');
      refetchSettings();
    } catch (err: any) {
      showToast(err?.data?.error?.message || 'Failed to update hotel settings', true);
    }
  };

  const filteredStaff = staffUsers.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      st.email.toLowerCase().includes(staffSearchQuery.toLowerCase());
    const matchesRole = staffRoleFilter === 'ALL' || st.role === staffRoleFilter;
    return matchesSearch && matchesRole;
  });

  if (!canManageSettings) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-sans text-xl font-bold text-[#1E293B] dark:text-white">
            Access Restricted to Super Administrators
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            You are currently logged in as <strong>{user?.name} ({user?.role})</strong>. Only hotel Super Administrators with system management permissions can configure staff access policies and hotel settings.
          </p>
          <div className="pt-2">
            <Link to="/admin/dashboard">
              <Button variant="primary" size="md">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="System Configuration & Access Control"
        title="Settings & Staff Permissions"
        subtitle="Manage access permissions for Managers and Front Desk associates, grant individual operational privileges, and configure property policies."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              PMS Version 2.0 • Real-Time RBAC
            </span>
          </div>
        }
      />

      {/* Toast notifications */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {errorToast && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-rose-600 dark:text-rose-400 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('ROLES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ROLES'
              ? 'bg-[#487FFF] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Role Permissions Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STAFF_INDIVIDUAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'STAFF_INDIVIDUAL'
              ? 'bg-[#487FFF] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Individual Staff Overrides</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'STAFF_INDIVIDUAL'
                ? 'bg-white text-[#487FFF]'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {staffUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROPERTY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'PROPERTY'
              ? 'bg-[#487FFF] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Property Operational Rules</span>
        </button>
      </div>

      {/* Loading & Error States */}
      {(isMetadataLoading || isSettingsLoading) && (
        <LoadingSpinner size="lg" message="Loading configuration and permissions catalog..." fullPage />
      )}

      {(isMetadataError || isSettingsError) && (
        <ErrorMessage
          title="Failed to load settings"
          message="Could not retrieve permission matrix or property settings from the server."
          onRetry={() => {
            refetchMetadata();
            refetchSettings();
          }}
        />
      )}

      {/* ============================================================== */}
      {/* TAB 1: Role Permissions Matrix */}
      {/* ============================================================== */}
      {activeTab === 'ROLES' && !isMetadataLoading && (
        <div className="space-y-6">
          {/* Role Selection Banner */}
          <div className="p-6 rounded-2xl border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-[#487FFF] block mb-1">
                  Step 1: Select Role to Configure
                </span>
                <h3 className="font-sans text-lg font-bold text-[#1E293B] dark:text-white">
                  {selectedRole === 'MANAGER'
                    ? 'Hotel Operations Manager Role'
                    : 'Front Desk Associate & Reception Staff Role'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {selectedRole === 'MANAGER'
                    ? 'Supervises front desk, views financial reports, manages inventory, and handles escalations.'
                    : 'Handles daily guest check-in, keycard assignment, physical room walks, and cashiering.'}
                </p>
              </div>

              {/* Role Toggle Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedRole('FRONT_DESK')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedRole === 'FRONT_DESK'
                      ? 'bg-[#487FFF] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Front Desk Staff</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      selectedRole === 'FRONT_DESK'
                        ? 'bg-white text-[#487FFF]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {rolePermissionsState['FRONT_DESK']?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('MANAGER')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedRole === 'MANAGER'
                      ? 'bg-[#487FFF] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Hotel Manager</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      selectedRole === 'MANAGER'
                        ? 'bg-white text-[#487FFF]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {rolePermissionsState['MANAGER']?.length || 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Save Action Bar at Top */}
            <div className="mt-5 pt-4 border-t border-[#EAECF0] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-xs text-[#1E293B] dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyToExistingStaff}
                  onChange={(e) => setApplyToExistingStaff(e.target.checked)}
                  className="rounded border-[#EAECF0] dark:border-slate-700 text-[#487FFF] focus:ring-[#487FFF]"
                />
                <span className="font-semibold">
                  Apply updates to all existing employees assigned to{' '}
                  <strong className="text-[#487FFF]">{selectedRole}</strong>
                </span>
              </label>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingRole}
                  onClick={handleSaveRolePermissions}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save {selectedRole} Permissions Policy
                </Button>
              </div>
            </div>
          </div>

          {/* Categorized Permissions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {catalog.map((cat) => {
              const catPermIds = cat.permissions.map((p) => p.id);
              const activeCount = catPermIds.filter((id) => isRolePermissionChecked(id)).length;
              const allChecked = activeCount === catPermIds.length;

              return (
                <div
                  key={cat.category}
                  className="rounded-2xl border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-[#1E293B] p-5 shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-4"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0] dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans text-sm font-bold text-[#1E293B] dark:text-white">
                          {cat.category}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] border border-blue-100 dark:border-blue-900">
                          {activeCount} / {catPermIds.length} Granted
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {cat.categoryDescription}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectAllForCategory(cat)}
                      className="text-xs font-bold text-[#487FFF] hover:underline shrink-0"
                    >
                      {allChecked ? 'Clear All' : 'Select All'}
                    </button>
                  </div>

                  {/* Permission Items List */}
                  <div className="space-y-2">
                    {cat.permissions.map((p) => {
                      const isChecked = isRolePermissionChecked(p.id);

                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-50/40 dark:bg-blue-950/30 border-[#487FFF]/40 text-[#1E293B] dark:text-white'
                              : 'bg-[#F8F9FA] dark:bg-slate-800/40 border-[#EAECF0] dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-[#487FFF]/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRolePermission(p.id)}
                            className="mt-0.5 rounded border-[#EAECF0] dark:border-slate-700 text-[#487FFF] focus:ring-[#487FFF]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#1E293B] dark:text-white">
                                {p.label}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {p.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {p.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Save Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-slate-800 flex items-center justify-between shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Configured <strong>{rolePermissionsState[selectedRole]?.length || 0} permissions</strong> for{' '}
              <strong className="text-[#487FFF]">{selectedRole}</strong>.
            </span>
            <Button
              variant="primary"
              size="md"
              isLoading={isUpdatingRole}
              onClick={handleSaveRolePermissions}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save {selectedRole} Access Policy
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: Individual Employee Access Overrides */}
      {/* ============================================================== */}
      {activeTab === 'STAFF_INDIVIDUAL' && !isMetadataLoading && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="p-4 rounded-2xl border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-[#EAECF0] dark:border-slate-700 text-[#1E293B] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#487FFF] shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl self-start sm:self-auto">
              {(['ALL', 'MANAGER', 'FRONT_DESK'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setStaffRoleFilter(r)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    staffRoleFilter === r
                      ? 'bg-[#487FFF] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r === 'ALL' ? 'All Staff' : r === 'MANAGER' ? 'Manager' : 'Front Desk'}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStaff.map((staff) => {
              const permCount = staff.permissions?.length || 0;
              const isSuper = staff.role === 'SUPER_ADMIN';

              return (
                <div
                  key={staff.id}
                  className="rounded-2xl border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-[#1E293B] p-5 shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#487FFF]/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] border border-blue-100 dark:border-blue-900 flex items-center justify-center font-bold text-sm">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-sans text-sm font-bold text-[#1E293B] dark:text-white">
                            {staff.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate max-w-[170px]">
                            {staff.email}
                          </span>
                        </div>
                      </div>

                      <StatusBadge status={staff.role} size="sm" />
                    </div>

                    {/* Contact & Status Details */}
                    <div className="mt-4 pt-3 border-t border-[#EAECF0] dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>Mobile Contact</span>
                        <span className="font-mono text-[#1E293B] dark:text-white font-medium">{staff.mobile}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>System Status</span>
                        <span className="flex items-center gap-1 font-semibold text-[#10B981]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>Granted Privileges</span>
                        <span className="font-bold text-[#487FFF]">
                          {isSuper ? 'Complete Access (24/24)' : `${permCount} Permissions`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#EAECF0] dark:border-slate-800">
                    {isSuper ? (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5 py-1.5">
                        <Lock className="w-3.5 h-3.5" /> Super Admin retains unrestricted system access
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenStaffEditor(staff)}
                        className="w-full justify-between"
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      >
                        Customize Access Privileges
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Staff Permissions Modal */}
      {editingStaff && (
        <Modal
          isOpen={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          title={`Custom Permissions: ${editingStaff.name}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs text-[#1E293B] dark:text-white flex items-center justify-between">
              <div>
                <span className="font-bold">{editingStaff.name}</span> •{' '}
                <span className="text-[#487FFF] uppercase font-mono font-bold">{editingStaff.role}</span>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{editingStaff.email}</p>
              </div>
              <div className="text-right font-mono font-bold text-[#487FFF]">
                {staffPermissionsDraft.length} / 24 Granted
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle specific options below to customize individual access privileges for this employee.
            </p>

            <div className="space-y-4">
              {catalog.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-[#EAECF0] dark:border-slate-800 pb-1">
                    {cat.category}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.permissions.map((p) => {
                      const checked = staffPermissionsDraft.includes(p.id);

                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                            checked
                              ? 'bg-blue-50/40 dark:bg-blue-950/40 border-[#487FFF]/40 text-[#1E293B] dark:text-white'
                              : 'bg-[#F8F9FA] dark:bg-slate-850 border-[#EAECF0] dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleStaffDraftPermission(p.id)}
                            className="mt-0.5 rounded border-[#EAECF0] dark:border-slate-700 text-[#487FFF] focus:ring-[#487FFF]"
                          />
                          <div className="min-w-0">
                            <span className="font-bold block text-[11px] text-[#1E293B] dark:text-white">{p.label}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                              {p.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#EAECF0] dark:border-slate-800 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setEditingStaff(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isUpdatingStaff}
                onClick={handleSaveStaffIndividual}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Employee Privileges
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* TAB 3: Property Operational Settings */}
      {/* ============================================================== */}
      {activeTab === 'PROPERTY' && !isSettingsLoading && (
        <form onSubmit={handleSavePropertySettings} className="space-y-6">
          <div className="p-6 rounded-2xl border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-5">
            <div>
              <h3 className="font-sans text-lg font-bold text-[#1E293B] dark:text-white">
                Hotel Profile & Contact Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official property identity displayed on guest invoices, vouchers, and confirmation emails.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hotel Property Name"
                value={propForm.propertyName}
                onChange={(e) => setPropForm({ ...propForm, propertyName: e.target.value })}
                required
              />
              <Input
                label="Property Tagline / Subtitle"
                value={propForm.tagline}
                onChange={(e) => setPropForm({ ...propForm, tagline: e.target.value })}
              />
              <Input
                label="Front Desk Telephone"
                value={propForm.phone}
                onChange={(e) => setPropForm({ ...propForm, phone: e.target.value })}
                required
              />
              <Input
                label="Reservations Email"
                type="email"
                value={propForm.email}
                onChange={(e) => setPropForm({ ...propForm, email: e.target.value })}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Street Address"
                  value={propForm.address}
                  onChange={(e) => setPropForm({ ...propForm, address: e.target.value })}
                  required
                />
              </div>
              <Input
                label="City"
                value={propForm.city}
                onChange={(e) => setPropForm({ ...propForm, city: e.target.value })}
                required
              />
              <Input
                label="State / Province"
                value={propForm.state}
                onChange={(e) => setPropForm({ ...propForm, state: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Operational Hours & Pricing Rules */}
          <div className="p-6 rounded-2xl border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-[0_2px_6px_rgba(0,0,0,0.02)] space-y-5">
            <div>
              <h3 className="font-sans text-lg font-bold text-[#1E293B] dark:text-white">
                Check-in/Check-out Timings & Hourly Rates
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Governs arrival schedules, customer extra stay billing, and automated tax calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#487FFF]" /> Standard Check-In Time
                </label>
                <input
                  type="time"
                  value={propForm.checkInTime}
                  onChange={(e) => setPropForm({ ...propForm, checkInTime: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 text-[#1E293B] dark:text-white text-xs font-semibold rounded-xl border border-[#EAECF0] dark:border-slate-700 p-2.5 outline-none focus:border-[#487FFF]"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default check-in (12:00 PM)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#487FFF]" /> Standard Check-Out Time
                </label>
                <input
                  type="time"
                  value={propForm.checkOutTime}
                  onChange={(e) => setPropForm({ ...propForm, checkOutTime: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 text-[#1E293B] dark:text-white text-xs font-semibold rounded-xl border border-[#EAECF0] dark:border-slate-700 p-2.5 outline-none focus:border-[#487FFF]"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default check-out (11:00 AM)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#487FFF]" /> Extra Stay Hourly Rate (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={propForm.extraStayHourlyRateRupees}
                    onChange={(e) =>
                      setPropForm({ ...propForm, extraStayHourlyRateRupees: Number(e.target.value) })
                    }
                    className="w-full bg-[#F8F9FA] dark:bg-slate-800 text-[#1E293B] dark:text-white text-xs font-bold rounded-xl border border-[#EAECF0] dark:border-slate-700 pl-8 pr-3 py-2.5 outline-none focus:border-[#487FFF]"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Billed per hour for customer late checkout extensions
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-300 mb-1.5">
                  Goods & Services Tax (GST %)
                </label>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={propForm.defaultGstPercentage}
                  onChange={(e) =>
                    setPropForm({ ...propForm, defaultGstPercentage: Number(e.target.value) })
                  }
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 text-[#1E293B] dark:text-white text-xs font-semibold rounded-xl border border-[#EAECF0] dark:border-slate-700 p-2.5 outline-none focus:border-[#487FFF]"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Standard hospitality tax (12%)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-300 mb-1.5">
                  Temporary Room Hold (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={propForm.holdDurationMinutes}
                  onChange={(e) =>
                    setPropForm({ ...propForm, holdDurationMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 text-[#1E293B] dark:text-white text-xs font-semibold rounded-xl border border-[#EAECF0] dark:border-slate-700 p-2.5 outline-none focus:border-[#487FFF]"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Checkout inventory lock duration</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] dark:text-slate-300 mb-1.5">
                  Free Cancellation Grace (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="72"
                  value={propForm.cancellationGraceHours}
                  onChange={(e) =>
                    setPropForm({ ...propForm, cancellationGraceHours: Number(e.target.value) })
                  }
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 text-[#1E293B] dark:text-white text-xs font-semibold rounded-xl border border-[#EAECF0] dark:border-slate-700 p-2.5 outline-none focus:border-[#487FFF]"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Free cancellation window before check-in</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUpdatingSettings}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Hotel Operational Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
