import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-rose-800/50 bg-rose-950/40 p-4 md:p-6 backdrop-blur-md ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3.5">
        <div className="rounded-lg bg-rose-900/60 p-2 text-rose-300 ring-1 ring-rose-500/30">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-rose-200">{title}</h3>
          <p className="mt-1 text-sm text-rose-300/90 leading-relaxed">{message}</p>
          {onRetry && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="border-rose-700/60 text-rose-200 hover:bg-rose-900/50"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
