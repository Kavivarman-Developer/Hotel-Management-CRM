import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

export const ErrorBoundary: React.FC = () => {
  const error = useRouteError();

  let errorMessage = 'An unexpected error occurred while rendering this page.';
  let errorTitle = 'Something Went Wrong';
  let statusCode = 500;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    errorTitle = `${error.status} ${error.statusText}`;
    errorMessage = error.data?.message || error.statusText;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-widest text-gold-400 font-bold block mb-1">
            Grand OMR Residency
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-100">{errorTitle}</h2>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed font-mono bg-stone-950/60 p-3 rounded-xl border border-stone-800/80 overflow-x-auto text-left">
            {errorMessage}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto"
          >
            Reload Page
          </Button>

          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Home className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto"
            >
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
