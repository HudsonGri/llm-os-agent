import { NextRequest, NextResponse } from 'next/server';
import { validateAccessCode, verifySession } from '@/lib/actions/auth';
import { cookies } from 'next/headers';

// POST for code validation via form submission
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }
    
    const result = await validateAccessCode(code);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid access code' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in auth API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET for status check and code validation via URL
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const code = url.searchParams.get('code');
  
  // If code is provided, validate it and redirect
  if (code) {
    try {
      const result = await validateAccessCode(code);
      
      if (result.success) {
        // Redirect to root on success
        return NextResponse.redirect(new URL('/', request.url));
      } else {
        // Redirect back to access page with error
        return NextResponse.redirect(
          new URL(`/access?error=${encodeURIComponent(result.error || 'Invalid access code')}`, request.url)
        );
      }
    } catch (error: any) {
      console.error('Error validating access code:', error);
      return NextResponse.redirect(
        new URL(
          `/access?error=${encodeURIComponent(`Error validating access code: ${error.message || error}`)}`,
          request.url
        )
      );
    }
  }
  
  // If checking auth status
  if (action === 'check') {
    try {
      const session = await verifySession();
      
      if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
      
      return NextResponse.json({ authenticated: true });
    } catch (error) {
      console.error('Error verifying session:', error);
      return NextResponse.json(
        { error: 'An error occurred while verifying your session' },
        { status: 500 }
      );
    }
  }

  // Default response if no specific action
  return NextResponse.json(
    { error: 'Invalid request' },
    { status: 400 }
  );
}

// DELETE for logout
export async function DELETE() {
  try {
    // Clear the session cookie
    cookies().delete('session_token');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
} 