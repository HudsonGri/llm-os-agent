import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema/auth';

// GET /api/admin/sessions - List all active sessions
export async function GET() {
  try {
    // Get active sessions with their associated access codes
    const activeSessions = await db.query.sessions.findMany({
      with: {
        accessCode: true
      },
      where: (sessions, { gt }) => gt(sessions.expiresAt, new Date()),
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
    });

    return NextResponse.json(activeSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
} 