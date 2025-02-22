import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/chats';
import { eq, asc, sql } from 'drizzle-orm';
import { getUserId } from '@/lib/actions/chats';

export async function GET() {
  try {
    const userId = await getUserId();

    // First, get all unique conversation IDs with their earliest message
    const conversations = await db
      .select({
        id: chats.conversationId,
        firstMessage: sql<string>`MIN(${chats.content})`,
        timestamp: sql<string>`MIN(${chats.createdAt})`,
      })
      .from(chats)
      .where(eq(chats.userId, userId))
      .groupBy(chats.conversationId)
      .orderBy(sql`MIN(${chats.createdAt}) DESC`);

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      firstMessage: conv.firstMessage.slice(0, 100),
      timestamp: conv.timestamp,
    }));

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
} 