import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/actions/auth';

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    
    // Check if route is an admin route
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      // Allow admin access in development environment
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
      }
      
      // In production, block all access to admin routes as specified in the doc
      // Later this will be replaced with Supabase email verification
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized access to admin route' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Skip auth check for access page and auth API
    if (pathname === '/access' || pathname === '/api/auth') {
      return NextResponse.next();
    }
    
    // For protected routes, check for valid session
    // Now protecting root path '/' as well
    if (pathname === '/' || pathname === '/chatbot' || pathname.startsWith('/api/chat')) {
      const sessionToken = request.cookies.get('session_token')?.value;
      
      if (!sessionToken) {
        // Redirect to access page if no session token exists
        return NextResponse.redirect(new URL('/access', request.url));
      }
      
      // Later we will use the verifySession function here
      // For now, just allow the request to proceed if there's a token
    }
    
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