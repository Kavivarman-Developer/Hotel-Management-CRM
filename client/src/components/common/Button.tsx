import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'emerald' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#487FFF] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#487FFF] hover:bg-[#3868E0] text-white font-semibold shadow-sm shadow-blue-500/25 border-none',
      gold: 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-stone-950 font-semibold shadow-lg shadow-gold-500/20 hover:from-gold-500 hover:to-gold-300 focus:ring-gold-400 border border-gold-400/40',
      emerald:
        'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border-none shadow-sm shadow-emerald-500/20 focus:ring-emerald-500',
      outline:
        'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-[#EAECF0] dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white focus:ring-[#487FFF]',
      ghost:
        'bg-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 focus:ring-[#487FFF]',
      danger:
        'bg-rose-600 text-white border-none hover:bg-rose-700 focus:ring-rose-500 shadow-sm shadow-rose-500/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
