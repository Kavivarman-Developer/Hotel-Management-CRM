import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className,
  fullPage = false,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const content = (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        <Loader2 className={clsx('animate-spin text-gold-500', sizes[size])} />
        <div className="absolute inset-0 rounded-full blur-md bg-gold-500/20" />
      </div>
      {message && (
        <p className="text-sm font-medium tracking-wide text-stone-300 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center p-8">
        {content}
      </div>
    );
  }

  return content;
};
