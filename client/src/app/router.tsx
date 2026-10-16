import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Public Feature Pages
import { HomePage } from '@/features/home/pages/HomePage';
import { RoomsListPage } from '@/features/rooms/pages/RoomsListPage';
import { AvailabilityResultsPage } from '@/features/availability/pages/AvailabilityResultsPage';
import { CheckoutPage } from '@/features/bookings/pages/CheckoutPage';
import { BookingLookupPage } from '@/features/bookings/pages/BookingLookupPage';
import { PartnersPage } from '@/features/partners/pages/PartnersPage';
import { AdminPartnersPage } from '@/features/partners/pages/AdminPartnersPage';
import { QrRegistrationPage } from '@/features/qr-registration/pages/QrRegistrationPage';

// Auth Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';

// Admin / PMS Pages
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminBookingsPage } from '@/features/admin/pages/AdminBookingsPage';
import { StaysManagementPage } from '@/features/stays/pages/StaysManagementPage';
import { AdminRegistrationsPage } from '@/features/admin/pages/AdminRegistrationsPage';
import { AdminRoomsPage } from '@/features/admin/pages/AdminRoomsPage';
import { AdminStaffPage } from '@/features/admin/pages/AdminStaffPage';
import { AdminReportsPage } from '@/features/admin/pages/AdminReportsPage';
import { AdminVouchersPage } from '@/features/vouchers/pages/AdminVouchersPage';
import { AdminExtraStaysPage } from '@/features/extra-stays/pages/AdminExtraStaysPage';
import { AdminSettingsPage } from '@/features/settings/pages/AdminSettingsPage';

import { PermissionGuard } from '@/components/common/PermissionGuard';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// 404 Not Found Page
const NotFoundPage = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
    <h1 className="font-serif text-6xl font-extrabold text-gold-400 mb-2">404</h1>
    <h2 className="font-serif text-2xl font-bold text-stone-100 mb-2">Page Not Found</h2>
    <p className="text-stone-400 text-sm max-w-md mb-6">
      The page you requested does not exist or has been relocated in the Grand OMR Residency directory.
    </p>
    <a
      href="/"
      className="px-6 py-2.5 rounded-xl bg-gold-500 text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-gold-400 transition-colors"
    >
      Return Home
    </a>
  </div>
);

export const router = createBrowserRouter([
  // Public Guest Facing Routes
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'rooms', element: <RoomsListPage /> },
      { path: 'availability', element: <AvailabilityResultsPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'my-booking', element: <BookingLookupPage /> },
      { path: 'partners', element: <PartnersPage /> },
      { path: 'qr/:token', element: <QrRegistrationPage /> },
      { path: 'guest-registration', element: <QrRegistrationPage /> },
      { path: 'guest-registration/:token', element: <QrRegistrationPage /> },
      { path: 'register/:token', element: <QrRegistrationPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Staff Login
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
  },

  // Protected Admin & Front Desk PMS Routes
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      {
        path: 'bookings',
        element: (
          <PermissionGuard requiredPermissions={['bookings.view', 'bookings.create', 'bookings.update']}>
            <AdminBookingsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'stays',
        element: (
          <PermissionGuard requiredPermissions={['checkin.complete', 'checkout.complete', 'dashboard.view']}>
            <StaysManagementPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'extra-stays',
        element: (
          <PermissionGuard requiredPermissions={['checkin.complete', 'checkout.complete', 'bookings.update']}>
            <AdminExtraStaysPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'vouchers',
        element: (
          <PermissionGuard requiredPermissions={['rates.manage', 'bookings.create']} requiredRoles={['SUPER_ADMIN', 'MANAGER']}>
            <AdminVouchersPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'registrations',
        element: (
          <PermissionGuard requiredPermissions={['qr_registrations.view', 'guests.view']}>
            <AdminRegistrationsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'rooms',
        element: (
          <PermissionGuard requiredPermissions={['rooms.view', 'rooms.manage']}>
            <AdminRoomsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'staff',
        element: (
          <PermissionGuard requiredPermissions={['staff.manage']} requiredRoles={['SUPER_ADMIN', 'MANAGER']}>
            <AdminStaffPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <PermissionGuard requiredPermissions={['reports.view', 'reports.export']} requiredRoles={['SUPER_ADMIN', 'MANAGER']}>
            <AdminReportsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'partners',
        element: (
          <PermissionGuard requiredPermissions={['partners.manage']} requiredRoles={['SUPER_ADMIN', 'MANAGER']}>
            <AdminPartnersPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <PermissionGuard requiredPermissions={['permissions.manage', 'settings.manage']} requiredRoles={['SUPER_ADMIN']}>
            <AdminSettingsPage />
          </PermissionGuard>
        ),
      },
    ],
  },
]);
