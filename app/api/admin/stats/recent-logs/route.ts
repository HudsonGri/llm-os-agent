import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/chats';
import { desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic'; // Disable caching for this route

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 6;
    
    // Get recent conversations with their first message and metadata
    const recentConversations = await db.execute(sql`
      WITH ranked_chats AS (
        SELECT 
          ${chats.conversationId} as "conversationId",
          ${chats.userId} as "userId",
          ${chats.topic} as "topic",
          ${chats.createdAt} as "createdAt",
          ${chats.rating} as "rating",
          ROW_NUMBER() OVER (PARTITION BY ${chats.conversationId} ORDER BY ${chats.createdAt} ASC) as rn
        FROM ${chats}
        WHERE ${chats.role} = 'user'
      )
      SELECT 
        "conversationId" as id,
        "topic",
        "createdAt" as timestamp,
        "rating"
      FROM ranked_chats
      WHERE rn = 1
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `);
    
    // Format the results
    const logs = recentConversations.map((log: any) => {
      let formattedDate = 'Unknown date';
      try {
        if (log.timestamp) {
          formattedDate = new Date(log.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch (e) {
        console.error('Error formatting date:', e);
      }
      
      return {
        id: log.id,
        topic: log.topic || 'General Question',
        timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : null,
        formattedDate,
        rating: log.rating // Keep as string 'up' or 'down'
      };
    });
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent logs', 
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error' 
          : undefined 
      }, 
      { status: 500 }
    );
  }
} 