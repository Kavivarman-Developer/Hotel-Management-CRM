import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { Button } from './Button';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallbackToDashboard?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermissions,
  requiredRoles,
  fallbackToDashboard = false,
}) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Super Administrator always has unrestricted access to all operations
  if (user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // Check Role-based restriction if specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      if (fallbackToDashboard) return <Navigate to="/admin/dashboard" replace />;
      return <AccessDeniedCard user={user} />;
    }
  }

  // Check Granular permissions restriction if specified
  if (requiredPermissions && requiredPermissions.length > 0) {
    const userPerms = user.permissions || [];
    const hasPermission = requiredPermissions.some((p) => userPerms.includes(p as any));
    if (!hasPermission) {
      if (fallbackToDashboard) return <Navigate to="/admin/dashboard" replace />;
      return <AccessDeniedCard user={user} />;
    }
  }

  return <>{children}</>;
};

const AccessDeniedCard: React.FC<{ user: any }> = ({ user }) => (
  <div className="max-w-2xl mx-auto py-16 px-4 text-center">
    <div className="p-8 rounded-2xl bg-white dark:bg-stone-900/80 border border-slate-200 dark:border-stone-800 shadow-xl space-y-4 backdrop-blur-md">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
        <Lock className="w-7 h-7" />
      </div>
      <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-stone-100">
        Access Restricted
      </h2>
      <p className="text-xs text-slate-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
        Your account <strong>{user?.name} ({user?.role})</strong> does not have permission to view or manage this section. If you require access, please contact your hotel Super Administrator.
      </p>
      <div className="pt-2">
        <Link to="/admin/dashboard">
          <Button variant="gold" size="md">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  </div>
);
