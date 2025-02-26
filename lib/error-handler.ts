import { NextResponse } from 'next/server';

type ErrorDetails = {
  message: string;
  status?: number;
  expose?: boolean;
  context?: Record<string, any>;
};

/**
 * Consistent API error response handler
 * 
 * @param error The error that occurred
 * @param defaultMessage Default message to show if error cannot be categorized
 * @param logPrefix Prefix for console error logs
 * @returns NextResponse with appropriate status code and formatted error
 */
export function handleApiError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  logPrefix = 'API Error'
): NextResponse {
  console.error(`${logPrefix}:`, error);
  
  // Default values
  let status = 500;
  let message = defaultMessage;
  let details: string | undefined = undefined;
  
  // Show detailed errors only in development
  const isDev = process.env.NODE_ENV === 'development';

  if (error instanceof Error) {
    // Extract message and add stack trace in development
    message = error.message || defaultMessage;
    if (isDev) {
      details = error.stack;
    }
    
    // Handle custom error properties if they exist
    const errorDetails = (error as Error & { details?: ErrorDetails }).details;
    if (errorDetails) {
      if (errorDetails.status) {
        status = errorDetails.status;
      }
      if (errorDetails.message) {
        message = errorDetails.message;
      }
      if (isDev && errorDetails.context) {
        details = JSON.stringify(errorDetails.context);
      }
    }
    
    // Handle common error types
    if (error.name === 'ValidationError') {
      status = 400;
    } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
      status = 404;
    } else if (error.message.includes('unauthorized') || error.message.includes('not authorized')) {
      status = 401;
    } else if (error.message.includes('forbidden') || error.message.includes('not allowed')) {
      status = 403;
    } else if (error.message.includes('too many') || error.message.includes('rate limit')) {
      status = 429;
    } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
      status = 504;
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      status = 503;
    }
  }
  
  // Create and return the response
  return NextResponse.json(
    { 
      error: message,
      ...(isDev && details ? { details } : {})
    },
    { status }
  );
}

/**
 * Create a custom error with additional metadata
 * 
 * @param message The error message
 * @param status HTTP status code
 * @param context Additional context for debugging
 * @returns Error object with details
 */
export function createApiError(
  message: string,
  status = 500,
  context?: Record<string, any>
): Error {
  const error = new Error(message);
  (error as any).details = {
    message,
    status,
    context
  };
  return error;
} 