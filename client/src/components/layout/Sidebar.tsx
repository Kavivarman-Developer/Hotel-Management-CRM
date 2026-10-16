import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  QrCode,
  BedDouble,
  Users,
  BarChart3,
  Building2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Settings,
  Tag,
  Clock,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { useLogoutUserMutation } from '@/features/auth/authApi';
import { useNotifications } from '@/context/NotificationContext';
import { useGetAdminExtraStaysQuery } from '@/features/extra-stays/extraStaysApi';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [logoutApi] = useLogoutUserMutation();
  const { unreadCount } = useNotifications();
  const { data: extraStaysRes } = useGetAdminExtraStaysQuery({ status: 'PENDING' }, { pollingInterval: 15000 });
  const pendingExtraStaysCount = extraStaysRes?.data?.length || 0;

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      dispatch(logout());
    }
  };

  interface NavItem {
    label: string;
    path: string;
    icon: any;
    requiredRole?: string[];
    requiredPermissions?: string[];
    badge?: number;
  }

  // 1. Daily Operations (Unique paths, zero duplicates)
  const operationalItems: NavItem[] = [
    {
      label: 'Reservations',
      path: '/admin/bookings',
      icon: CalendarDays,
      requiredPermissions: ['bookings.view', 'bookings.create', 'bookings.update'],
    },
    {
      label: 'Room Operations',
      path: '/admin/rooms',
      icon: BedDouble,
      requiredPermissions: ['rooms.view', 'rooms.manage'],
    },
    {
      label: 'Digital Guest Pass',
      path: '/admin/registrations',
      icon: QrCode,
      requiredPermissions: ['qr_registrations.view', 'guests.view'],
    },
    {
      label: 'Check-in / Check-out',
      path: '/admin/stays',
      icon: DoorOpen,
      requiredPermissions: ['checkin.complete', 'checkout.complete', 'dashboard.view'],
    },
    {
      label: 'Customer Extra Stays',
      path: '/admin/extra-stays',
      icon: Clock,
      requiredPermissions: ['checkin.complete', 'checkout.complete', 'bookings.update'],
      badge: pendingExtraStaysCount > 0 ? pendingExtraStaysCount : undefined,
    },
  ];

  // 2. Business Management (Unique paths, zero duplicates)
  const managementItems: NavItem[] = [
    {
      label: 'Manage Staff',
      path: '/admin/staff',
      icon: Users,
      requiredPermissions: ['staff.manage'],
      requiredRole: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      label: 'Reports & Revenue',
      path: '/admin/reports',
      icon: BarChart3,
      requiredPermissions: ['reports.view', 'reports.export'],
      requiredRole: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      label: 'Vouchers & Offers',
      path: '/admin/vouchers',
      icon: Tag,
      requiredPermissions: ['rates.manage', 'bookings.create'],
      requiredRole: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      label: 'Partner Hotels',
      path: '/admin/partners',
      icon: Building2,
      requiredPermissions: ['partners.manage'],
      requiredRole: ['SUPER_ADMIN', 'MANAGER'],
    },
  ];

  // 3. System Access (Unique paths, zero duplicates)
  const systemItems: NavItem[] = [
    {
      label: 'Settings & Permissions',
      path: '/admin/settings',
      icon: Settings,
      requiredPermissions: ['permissions.manage', 'settings.manage'],
      requiredRole: ['SUPER_ADMIN'],
    },
  ];

  const filterAllowed = (items: NavItem[]) =>
    items.filter((item) => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;

      if (item.requiredRole && item.requiredRole.length > 0) {
        if (!item.requiredRole.includes(user.role)) {
          return false;
        }
      }

      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        const userPerms = user.permissions || [];
        const hasMatchingPermission = item.requiredPermissions.some((perm) =>
          userPerms.includes(perm as any)
        );
        if (!hasMatchingPermission) {
          return false;
        }
      }

      return true;
    });

  const isDashboardActive = location.pathname === '/admin/dashboard';

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white dark:bg-[#1E293B] border-r border-[#EAECF0] dark:border-slate-800 flex flex-col h-screen shrink-0 select-none z-40 transition-all duration-300 font-sans`}
    >
      {/* Brand Header matching WowDash */}
      <div
        className={`h-16 px-4 flex items-center ${
          isCollapsed ? 'justify-center' : 'justify-between'
        } border-b border-[#EAECF0] dark:border-slate-800`}
      >
        <NavLink to="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#487FFF] flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-blue-500/25 shrink-0">
            W
          </div>
          {!isCollapsed && (
            <div className="flex items-center truncate">
              <span className="text-xl font-bold tracking-tight text-[#1E293B] dark:text-white">
                Grand<span className="text-[#487FFF]">Dash</span>
              </span>
              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-[#487FFF] border border-blue-200/50 dark:border-blue-800">
                PMS
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-xs font-semibold custom-scrollbar">
        {/* Primary Dashboard Link */}
        <div>
          <NavLink
            to="/admin/dashboard"
            title={isCollapsed ? 'Dashboard' : undefined}
            className={({ isActive }) =>
              `w-full flex items-center ${
                isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3.5 py-2.5'
              } rounded-xl transition-all font-semibold ${
                isActive
                  ? 'bg-[#487FFF] text-white shadow-[0_4px_12px_rgba(72,127,255,0.25)]'
                  : 'text-[#4B5563] dark:text-slate-300 hover:text-[#487FFF] hover:bg-[#F4F6FA] dark:hover:bg-slate-800/80'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${isDashboardActive ? 'text-white' : 'text-gray-400 dark:text-slate-400'}`} />
              {!isCollapsed && <span className="text-sm">Dashboard</span>}
            </div>
            {!isCollapsed && (
              <ChevronRight
                className={`w-3.5 h-3.5 ${isDashboardActive ? 'text-white' : 'text-gray-300 dark:text-slate-600'}`}
              />
            )}
          </NavLink>
        </div>

        {/* Section 1: Operations */}
        {filterAllowed(operationalItems).length > 0 && (
          <div className="space-y-1">
            {!isCollapsed ? (
              <span className="px-3 text-[11px] font-bold text-[#94A3B8] dark:text-slate-500 uppercase tracking-wider block mb-1">
                Operations
              </span>
            ) : (
              <div className="my-2 border-t border-[#EAECF0] dark:border-slate-800" />
            )}
            {filterAllowed(operationalItems).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3.5 py-2.5'
                    } rounded-xl transition-all text-xs font-semibold group relative ${
                      isActive
                        ? 'bg-[#487FFF] text-white shadow-[0_4px_12px_rgba(72,127,255,0.25)]'
                        : 'text-[#4B5563] dark:text-slate-300 hover:text-[#487FFF] hover:bg-[#F4F6FA] dark:hover:bg-slate-800/80'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 transition-colors text-inherit shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed ? (
                    <div className="flex items-center gap-1.5">
                      {item.badge ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px] animate-pulse">
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  ) : item.badge ? (
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Section 2: Business Management */}
        {filterAllowed(managementItems).length > 0 && (
          <div className="space-y-1 pt-1">
            {!isCollapsed ? (
              <span className="px-3 text-[11px] font-bold text-[#94A3B8] dark:text-slate-500 uppercase tracking-wider block mb-1">
                Management
              </span>
            ) : (
              <div className="my-2 border-t border-[#EAECF0] dark:border-slate-800" />
            )}
            {filterAllowed(managementItems).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3.5 py-2.5'
                    } rounded-xl transition-all text-xs font-semibold group ${
                      isActive
                        ? 'bg-[#487FFF] text-white shadow-[0_4px_12px_rgba(72,127,255,0.25)]'
                        : 'text-[#4B5563] dark:text-slate-300 hover:text-[#487FFF] hover:bg-[#F4F6FA] dark:hover:bg-slate-800/80'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 transition-colors text-inherit shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  )}
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Section 3: System Access */}
        {filterAllowed(systemItems).length > 0 && (
          <div className="space-y-1 pt-1">
            {!isCollapsed ? (
              <span className="px-3 text-[11px] font-bold text-[#94A3B8] dark:text-slate-500 uppercase tracking-wider block mb-1">
                System Access
              </span>
            ) : (
              <div className="my-2 border-t border-[#EAECF0] dark:border-slate-800" />
            )}
            {filterAllowed(systemItems).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3.5 py-2.5'
                    } rounded-xl transition-all text-xs font-semibold group ${
                      isActive
                        ? 'bg-[#487FFF] text-white shadow-[0_4px_12px_rgba(72,127,255,0.25)]'
                        : 'text-[#4B5563] dark:text-slate-300 hover:text-[#487FFF] hover:bg-[#F4F6FA] dark:hover:bg-slate-800/80'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 transition-colors text-inherit shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer matching WowDash */}
      <div className="p-3 border-t border-[#EAECF0] dark:border-slate-800">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Sign Out Session' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0 py-2' : 'justify-between px-3 py-2'
          } rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors`}
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out Session</span>}
          </div>
          {!isCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
        </button>
      </div>
    </aside>
  );
};
