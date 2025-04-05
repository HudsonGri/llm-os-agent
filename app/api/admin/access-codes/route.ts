import { NextRequest, NextResponse } from 'next/server';
import { db, accessCodes } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET /api/admin/access-codes - List all access codes
export async function GET(req: NextRequest) {
  try {
    // Fetch all access codes with session count
    const result = await db.query.accessCodes.findMany({
      orderBy: [desc(accessCodes.createdAt)],
      with: {
        sessions: true,
      },
    });

    // Format the response
    const accessCodesWithSessionCount = result.map((code) => ({
      id: code.id,
      code: code.code,
      expires_at: code.expiresAt,
      revoked: code.revoked,
      created_at: code.createdAt,
      last_used_at: code.lastUsedAt,
      description: code.description,
      session_count: code.sessions.length,
    }));

    return NextResponse.json({ accessCodes: accessCodesWithSessionCount });
  } catch (error) {
    console.error('Error fetching access codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access codes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/access-codes - Create a new access code
export async function POST(req: NextRequest) {
  try {
    const { description, expires_at, custom_code } = await req.json();

    // Use custom code if provided, otherwise generate a secure random access code
    const code = custom_code ? custom_code : uuidv4();

    // Create the access code
    const result = await db.insert(accessCodes).values({
      code,
      description: description || null,
      expiresAt: expires_at ? new Date(expires_at) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
      revoked: false,
    }).returning();

    const accessCode = result[0];

    // Format the response
    const formattedAccessCode = {
      id: accessCode.id,
      code: accessCode.code,
      expires_at: accessCode.expiresAt,
      revoked: accessCode.revoked,
      created_at: accessCode.createdAt,
      last_used_at: accessCode.lastUsedAt,
      description: accessCode.description,
      session_count: 0,
    };

    return NextResponse.json({ accessCode: formattedAccessCode });
  } catch (error) {
    console.error('Error creating access code:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Access code already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create access code' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/access-codes - Update an access code (revoke/unrevoke)
export async function PATCH(req: NextRequest) {
  try {
    const { id, revoked } = await req.json();

    if (typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Invalid access code ID' },
        { status: 400 }
      );
    }

    // Update the access code
    const result = await db.update(accessCodes)
      .set({
        revoked: !!revoked,
      })
      .where(eq(accessCodes.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Access code not found' },
        { status: 404 }
      );
    }

    const accessCode = result[0];

    // Format the response
    const formattedAccessCode = {
      id: accessCode.id,
      code: accessCode.code,
      expires_at: accessCode.expiresAt,
      revoked: accessCode.revoked,
      created_at: accessCode.createdAt,
      last_used_at: accessCode.lastUsedAt,
      description: accessCode.description,
    };

    return NextResponse.json({ accessCode: formattedAccessCode });
  } catch (error) {
    console.error('Error updating access code:', error);
    return NextResponse.json(
      { error: 'Failed to update access code' },
      { status: 500 }
    );
  }
} 