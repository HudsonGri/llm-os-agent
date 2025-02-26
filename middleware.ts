import { NextResponse, NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    // Continue to the requested resource
    return NextResponse.next();
  } catch (error) {
    console.error('Unhandled error in middleware:', error);
    
    // Only intercept API requests for error handling
    // Let Next.js handle errors for page requests using the error.tsx pattern
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Return a JSON error response for API requests
      return new NextResponse(
        JSON.stringify({
          error: 'An unexpected server error occurred',
          // Only expose error details in development
          details: process.env.NODE_ENV === 'development' 
            ? error instanceof Error ? error.message : 'Unknown error' 
            : undefined
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // For page requests, continue to Next.js error handling
    return NextResponse.next();
  }
}

// Only run middleware on API routes and main pages
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 