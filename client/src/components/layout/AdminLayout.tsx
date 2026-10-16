import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Plus,
  Search,
  Menu,
  Mail,
  Sun,
  Moon,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAppSelector } from '@/app/hooks';
import { useTheme } from '@/context/ThemeContext';
import { NotificationDrawer } from '@/components/common/NotificationDrawer';
import { useNotifications } from '@/context/NotificationContext';
import { useGetMeQuery } from '@/features/auth/authApi';
import { NewBookingModal } from '@/components/common/NewBookingModal';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, openDrawer } = useNotifications();
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState('');

  const isDark = theme === 'dark';

  // Keep authenticated staff permissions synced with server
  useGetMeQuery(undefined, { skip: !isAuthenticated, pollingInterval: 30000 });

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'MANAGER':
        return 'Operations Manager';
      case 'FRONT_DESK':
        return 'Front Desk Officer';
      default:
        return role;
    }
  };

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans antialiased transition-colors duration-200 ${
        isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-[#F5F6FA] text-[#1E293B]'
      }`}
    >
      {/* Collapsible Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Navbar Header */}
        <header
          className={`h-16 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors duration-200 border-b ${
            isDark
              ? 'bg-[#1E293B] border-slate-800 text-white shadow-md'
              : 'bg-white border-[#EAECF0] text-[#1E293B] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
          }`}
        >
          {/* Left: Hamburger & Search Bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input */}
            <div className="relative w-64 md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchGlobal}
                onChange={(e) => setSearchGlobal(e.target.value)}
                className={`w-full text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition-all shadow-xs ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 focus:border-[#487FFF]'
                    : 'bg-[#F8F9FA] hover:bg-gray-100/70 focus:bg-white border border-[#E9ECEF] text-gray-800 placeholder-gray-400 focus:border-[#487FFF]'
                }`}
              />
            </div>
          </div>

          {/* Right Section: New Reservation, Theme Toggle, Mail, Bell, User Chip */}
          <div className="flex items-center gap-2.5">
            {/* Quick Reservation Button */}
            <button
              type="button"
              onClick={() => setIsNewBookingModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#487FFF] hover:bg-[#3868E0] text-white shadow-sm shadow-blue-500/20 h-9 px-3.5 text-xs font-bold rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Reservation</span>
            </button>

            {/* Light/Dark Toggle Icon */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-xs ${
                isDark
                  ? 'bg-slate-800 border border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-[#F8F9FA] border border-[#E9ECEF] text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
            </button>

            {/* Mail / Message Icon */}
            <button
              type="button"
              onClick={openDrawer}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-xs relative ${
                isDark
                  ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-[#F8F9FA] border border-[#E9ECEF] text-gray-600 hover:bg-gray-100'
              }`}
              title="Messages & Activity"
            >
              <Mail className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#487FFF]" />
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={openDrawer}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-xs relative ${
                isDark
                  ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-[#F8F9FA] border border-[#E9ECEF] text-gray-600 hover:bg-gray-100'
              }`}
              title="Live Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            <div
              className={`h-6 w-px mx-1 ${isDark ? 'bg-slate-700' : 'bg-[#EAECF0]'}`}
            />

            {/* User Profile Avatar with Online Status Dot */}
            <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#487FFF] to-[#60A5FA] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitials}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-bold block leading-tight group-hover:text-[#487FFF] transition-colors text-inherit">
                  {user.name}
                </span>
                <span className="text-[10px] font-medium text-gray-400 block">
                  {formatRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Notification Drawer */}
        <NotificationDrawer />

        {/* New Reservation Modal */}
        {isNewBookingModalOpen && (
          <NewBookingModal
            isOpen={isNewBookingModalOpen}
            onClose={() => setIsNewBookingModalOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 p-6 lg:p-8 transition-colors duration-200 ${
            isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-[#F5F6FA] text-[#1E293B]'
          }`}
        >
          <div className="max-w-[1680px] mx-auto space-y-6">
            <Outlet />

            {/* Bottom Footer */}
            <footer
              className={`mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-2 pb-6 transition-colors ${
                isDark ? 'border-slate-800 text-slate-500' : 'border-[#EAECF0] text-[#64748B]'
              }`}
            >
              <span>© 2026 Grand OMR Residency. All Rights Reserved.</span>
              <span>
                Made by <span className="text-[#487FFF] font-semibold">Grand OMR Tech Team</span>
              </span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};
