import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, Plus, ShieldCheck, RefreshCw, KeyRound, UserCheck, Info } from 'lucide-react';
import {
  useGetAdminStaffQuery,
  useAdminCreateStaffMutation,
  useAdminToggleStaffStatusMutation,
} from '../dashboardApi';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { User } from '@/types';
import { useAppSelector } from '@/app/hooks';

export const AdminStaffPage: React.FC = () => {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: response, isLoading, isError, refetch } = useGetAdminStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useAdminCreateStaffMutation();
  const [toggleStatus] = useAdminToggleStaffStatusMutation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FRONT_DESK');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-open modal if navigated with ?add=true or ?create=true
  useEffect(() => {
    if (searchParams.get('add') === 'true' || searchParams.get('create') === 'true') {
      setIsAddModalOpen(true);
      // Clean query parameter from URL
      searchParams.delete('add');
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const staffList = response?.data || [];

  const handleToggle = async (staff: User) => {
    try {
      await toggleStatus({
        id: staff.id || (staff as any)._id,
        isActive: !staff.isActive,
      }).unwrap();
      setSuccessToast(`Staff status updated for ${staff.name}`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Status toggle failed');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStaff({
        name,
        email,
        mobile,
        password,
        role,
      }).unwrap();

      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setMobile('');
      setPassword('');
      setRole('FRONT_DESK');
      setSuccessToast(`Staff user "${name}" onboarded successfully. They can now log in at /login.`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to create staff member');
    }
  };

  // Determine allowed roles to assign based on current user's role
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const roleOptions = isSuperAdmin
    ? [
        { label: 'Front Desk Associate', value: 'FRONT_DESK' },
        { label: 'Hotel Manager', value: 'MANAGER' },
        { label: 'Super Administrator', value: 'SUPER_ADMIN' },
      ]
    : [
        { label: 'Front Desk Associate', value: 'FRONT_DESK' },
        { label: 'Hotel Manager', value: 'MANAGER' },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access Control"
        title="Staff & Employee Management"
        subtitle="Super Admins and Managers can onboard hotel employees, assign roles (Manager, Front Desk), and control operational access."
        actions={
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link to="/admin/settings">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ShieldCheck className="w-4 h-4 text-[#487FFF]" />}
                >
                  Role & Policy Settings
                </Button>
              </Link>
            )}
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
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Add Staff Member
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading staff accounts..." fullPage />
      ) : isError ? (
        <ErrorMessage
          title="Error loading staff"
          message="Failed to retrieve staff directory from the PMS."
          onRetry={refetch}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 overflow-hidden shadow-sm backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-stone-300">
              <thead className="bg-slate-50 dark:bg-stone-950 uppercase tracking-wider text-[11px] text-slate-500 dark:text-stone-400 border-b border-slate-200 dark:border-stone-800">
                <tr>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-stone-800/80">
                {staffList.map((st) => (
                  <tr key={st.id || (st as any)._id} className="hover:bg-slate-50/80 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-stone-100">{st.name}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-stone-300">{st.email}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-stone-400">{st.mobile}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={st.role} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={st.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isSuperAdmin && (
                          <Link to="/admin/settings">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<KeyRound className="w-3.5 h-3.5 text-[#487FFF]" />}
                            >
                              Permissions
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant={st.isActive ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleToggle(st)}
                        >
                          {st.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Onboard New Staff Member"
        >
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-xl flex items-start gap-2.5 text-blue-900 dark:text-blue-200">
              <Info className="w-4 h-4 text-[#487FFF] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                The created staff member can immediately log in to the Property Management System at <code className="font-mono font-semibold bg-white/70 dark:bg-black/30 px-1 py-0.5 rounded">/login</code> using their email and assigned temporary password.
              </p>
            </div>

            <Input
              label="Staff Full Name"
              placeholder="e.g. Priyadharshini K"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Staff Email"
              type="email"
              placeholder="priya@grandomrresidency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Mobile Number"
              type="tel"
              placeholder="9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />

            <Input
              label="Temporary Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Select
              label="Role Assignment"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={roleOptions}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                Create Staff Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
