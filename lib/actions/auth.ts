'use server';

import { cookies, headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, gte, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { accessCodes, sessions } from '@/lib/db/schema/auth';
import { redirect } from 'next/navigation';

// This is a server action that can be called from a Page component
// It handles validation and redirects appropriately
export async function validateAndRedirect(code: string) {
  try {
    const result = await validateAccessCode(code);
    
    if (result.success) {
      return { success: true, redirect: true };
    } else {
      return { success: false, error: result.error || 'Invalid access code' };
    }
  } catch (error: any) {
    console.error('Error in validateAndRedirect:', error);
    return { 
      success: false, 
      error: `Error validating access code: ${error.message || error.toString()}` 
    };
  }
}

export async function validateAccessCode(code: string) {
  try {
    // Check if the access code exists and is valid
    const now = new Date();
    
    const validCode = await db.query.accessCodes.findFirst({
      where: and(
        eq(accessCodes.code, code),
        eq(accessCodes.revoked, false),
        gte(accessCodes.expiresAt, now)
      ),
    });

    if (!validCode) {
      return { success: false, error: 'Invalid or expired access code' };
    }

    // Create a new session
    const sessionToken = uuidv4();
    
    // Session expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Get the request headers
    const headersList = headers();
    
    // Get the user agent
    const userAgent = headersList.get('user-agent') || 'Unknown';
    
    // Get the IP address
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                      headersList.get('x-real-ip') || 
                      '127.0.0.1';
    
    await db.insert(sessions).values({
      sessionToken,
      accessCodeId: validCode.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    // Update the last used time for the access code
    await db
      .update(accessCodes)
      .set({ lastUsedAt: now })
      .where(eq(accessCodes.id, validCode.id));

    // Set the session cookie
    cookies().set({
      name: 'session_token',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt,
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Error validating access code:', error);
    return { success: false, error: 'An error occurred while validating the access code' };
  }
}

export async function verifySession() {
  try {
    const sessionToken = cookies().get('session_token')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const now = new Date();
    
    // Find the session
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.sessionToken, sessionToken),
        gte(sessions.expiresAt, now)
      ),
      with: {
        accessCode: true,
      },
    });
    
    // Type assertion to handle linter errors
    const accessCodeData = session?.accessCode as typeof accessCodes.$inferSelect | undefined;
    
    if (!session || !accessCodeData || accessCodeData.revoked || accessCodeData.expiresAt < now) {
      // Clear invalid session
      cookies().delete('session_token');
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

export async function createAccessCode(options: { 
  description?: string; 
  expiryDays?: number;
}) {
  try {
    const code = uuidv4();
    const expiryDays = options.expiryDays || 90; // Default 90 days
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    const [result] = await db.insert(accessCodes).values({
      code,
      expiresAt,
      description: options.description,
    }).returning({ id: accessCodes.id });
    
    return { success: true, code, id: result.id };
  } catch (error) {
    console.error('Error creating access code:', error);
    return { success: false, error: 'Failed to create access code' };
  }
}

export async function revokeAccessCode(id: number) {
  try {
    await db
      .update(accessCodes)
      .set({ revoked: true })
      .where(eq(accessCodes.id, id));
    
    return { success: true };
  } catch (error) {
    console.error('Error revoking access code:', error);
    return { success: false, error: 'Failed to revoke access code' };
  }
}

export async function logoutSession() {
  cookies().delete('session_token');
  redirect('/access');
} 