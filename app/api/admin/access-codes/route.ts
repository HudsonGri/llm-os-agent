import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accessCodes } from '@/lib/db/schema/auth';
import { createAccessCode, revokeAccessCode } from '@/lib/actions/auth';
import { eq } from 'drizzle-orm';

// GET /api/admin/access-codes - List all access codes
export async function GET() {
  try {
    // Get all access codes with their associated sessions
    const codes = await db.query.accessCodes.findMany({
      with: {
        sessions: true
      },
      orderBy: (accessCodes, { desc }) => [desc(accessCodes.createdAt)]
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error('Error fetching access codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access codes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/access-codes - Create a new access code
export async function POST(request: NextRequest) {
  try {
    const { description, expiryDays } = await request.json();
    
    const result = await createAccessCode({ 
      description,
      expiryDays: expiryDays ? parseInt(expiryDays) : undefined
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create access code' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating access code:', error);
    return NextResponse.json(
      { error: 'Failed to create access code' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/access-codes - Update an access code (revoke/unrevoke)
export async function PATCH(request: NextRequest) {
  try {
    const { id, revoked } = await request.json();
    
    if (revoked === true) {
      const result = await revokeAccessCode(id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to revoke access code' },
          { status: 500 }
        );
      }
    } else if (revoked === false) {
      // Un-revoke the access code
      await db
        .update(accessCodes)
        .set({ revoked: false })
        .where(eq(accessCodes.id, id));
    } else {
      return NextResponse.json(
        { error: 'Invalid request. The "revoked" field must be true or false.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating access code:', error);
    return NextResponse.json(
      { error: 'Failed to update access code' },
      { status: 500 }
    );
  }
} 