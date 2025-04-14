import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/chats';
import { eq, asc, sql } from 'drizzle-orm';
import { getUserId } from '@/lib/actions/chats';

export async function GET() {
  try {
    let userId: string;
    
    try {
      userId = await getUserId();
      if (!userId) {
        return NextResponse.json(
          { error: 'User authentication required' }, 
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
      return NextResponse.json(
        { error: 'Authentication error', details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined }, 
        { status: 401 }
      );
    }

    try {
      // First, get all unique conversation IDs with their earliest message
      // Also add condition to only include conversations where not all messages are deleted
      const conversations = await db.execute(
        sql`SELECT 
          c.conversation_id as id, 
          MIN(c.content) as first_message, 
          MIN(c.created_at) as timestamp
        FROM chats c
        WHERE c.user_id = ${userId}
        AND EXISTS (
          SELECT 1 FROM chats 
          WHERE conversation_id = c.conversation_id 
          AND (deleted IS NULL OR deleted = false)
        )
        GROUP BY c.conversation_id
        ORDER BY MIN(c.created_at) DESC`
      );

      const formattedConversations = (conversations as any[]).map(conv => ({
        id: conv.id,
        firstMessage: conv.first_message?.slice(0, 100),
        timestamp: conv.timestamp,
      }));

      return NextResponse.json(formattedConversations);
    } catch (error) {
      console.error('Error querying conversations from database:', error);
      
      // Database connection errors
      if (error instanceof Error && 
          (error.message.includes('database') || error.message.includes('connection'))) {
        return NextResponse.json(
          { error: 'Database connection error, please try again later' }, 
          { status: 503 }
        );
      }
      
      // SQL query errors
      if (error instanceof Error && 
          (error.message.includes('SQL') || error.message.includes('query'))) {
        return NextResponse.json(
          { error: 'Error processing database query' }, 
          { status: 500 }
        );
      }
      
      // Default database error
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined }, 
        { status: 500 }
      );
    }
  } catch (error) {
    // Catch-all for any other unhandled errors
    console.error('Unhandled error in conversations API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 