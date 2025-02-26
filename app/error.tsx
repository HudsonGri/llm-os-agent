'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Something went wrong</h1>
          <p className="text-zinc-600 mt-2">
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-sm font-medium text-red-800">Error details:</p>
              <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-32 whitespace-pre-wrap">
                {error.message}
                {'\n'}
                {error.stack}
              </pre>
            </div>
          )}
        </div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <Button
            variant="default"
            onClick={() => reset()}
            className="bg-zinc-900 hover:bg-zinc-800"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          >
            Go to home page
          </Button>
        </div>
      </div>
    </div>
  );
} 