import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#1E293B] mb-1.5"
          >
            {label}
            {props.required && <span className="text-[#487FFF] ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-[#F8F9FA] hover:bg-gray-100/70 focus:bg-white text-gray-800 placeholder-gray-400 text-xs rounded-xl border transition-all duration-200 outline-none',
                'focus:ring-2 focus:ring-[#487FFF]/20 focus:border-[#487FFF]',
                leftIcon ? 'pl-9' : 'pl-3.5',
                rightIcon ? 'pr-9' : 'pr-3.5',
                'py-2',
                error
                  ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-[#EAECF0] hover:border-gray-300',
                props.disabled && 'opacity-60 cursor-not-allowed bg-gray-100',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
