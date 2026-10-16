import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant =
  | 'confirmed'
  | 'held'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'pending'
  | 'paid'
  | 'clean'
  | 'dirty'
  | 'inspected'
  | 'maintenance'
  | 'active'
  | 'inactive'
  | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
}) => {
  const getAutoVariant = (statusText: string): BadgeVariant => {
    const s = statusText.toUpperCase().trim();
    if (s.includes('CONFIRMED') || s === 'PAID' || s === 'SUCCESS' || s === 'VERIFIED')
      return 'confirmed';
    if (s.includes('CHECKED_IN') || s === 'CLEAN') return 'checked_in';
    if (s.includes('CHECKED_OUT') || s === 'INSPECTED') return 'checked_out';
    if (s.includes('CANCEL') || s.includes('REJECT') || s.includes('FAIL')) return 'cancelled';
    if (s.includes('HELD') || s.includes('PENDING') || s.includes('DRAFT')) return 'pending';
    if (s.includes('MAINTENANCE') || s === 'OUT_OF_SERVICE' || s === 'DIRTY')
      return 'maintenance';
    if (s === 'ACTIVE') return 'active';
    if (s === 'INACTIVE') return 'inactive';
    return 'default';
  };

  const activeVariant = variant || getAutoVariant(status);

  const variantStyles: Record<BadgeVariant, string> = {
    confirmed: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40',
    held: 'bg-amber-50 dark:bg-amber-950/60 text-[#FF9F43] dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40',
    checked_in: 'bg-blue-50 dark:bg-blue-950/60 text-[#487FFF] dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40',
    checked_out: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700',
    cancelled: 'bg-rose-50 dark:bg-rose-950/60 text-[#EF4444] dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40',
    pending: 'bg-amber-50 dark:bg-amber-950/60 text-[#FF9F43] dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40',
    paid: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40',
    clean: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40',
    dirty: 'bg-orange-50 dark:bg-orange-950/60 text-[#FF9F43] dark:text-orange-400 border-orange-200/50 dark:border-orange-800/40',
    inspected: 'bg-blue-50 dark:bg-blue-950/60 text-[#487FFF] dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40',
    maintenance: 'bg-rose-50 dark:bg-rose-950/60 text-[#EF4444] dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40',
    active: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40',
    inactive: 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700',
    default: 'bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 tracking-normal',
    md: 'text-xs px-2.5 py-0.5 tracking-normal',
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center font-bold rounded-full border transition-colors shadow-xs',
        variantStyles[activeVariant],
        sizeStyles[size]
      )}
    >
      {formatText(status)}
    </span>
  );
};
