import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/chats';
import { sql, asc, desc, count, countDistinct, avg, max } from 'drizzle-orm';

export const dynamic = 'force-dynamic'; // Disable caching for this route

export async function GET(request: Request) {
  try {
    // Get the date range for queries (default 30 days)
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') ? parseInt(searchParams.get('days') as string, 10) : 30;
    
    // Set date window
    const endDate = new Date();
    // Add a day to include today fully
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Convert to ISO strings for SQL
    const startDateString = startDate.toISOString();
    const endDateString = endDate.toISOString();
    
    // 1. Calculate student participation (unique users with conversations)
    const userParticipation = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT ${chats.userId}) as "uniqueUsers"
      FROM ${chats}
      WHERE ${chats.createdAt} >= ${startDateString}
        AND ${chats.createdAt} <= ${endDateString}
        AND ${chats.role} = 'user'
    `);
    
    // Get total registered users (assuming we have a users table)
    // If no users table, we'll just use the active users as our base
    const uniqueUsers = Number(userParticipation[0]?.uniqueUsers) || 0;
    
    // 2. Get top topics
    const topTopics = await db.execute(sql`
      SELECT 
        ${chats.topic} as "topic",
        COUNT(*) as "count"
      FROM ${chats}
      WHERE ${chats.createdAt} >= ${startDateString}
        AND ${chats.createdAt} <= ${endDateString}
        AND ${chats.role} = 'user'
        AND ${chats.topic} IS NOT NULL
        AND ${chats.topic} != ''
      GROUP BY ${chats.topic}
      ORDER BY "count" DESC
    `);
    
    // 3. Get messages per conversation
    const messageMetrics = await db.execute(sql`
      SELECT
        COUNT(*) as "totalMessages",
        COUNT(DISTINCT ${chats.conversationId}) as "totalConversations"
      FROM ${chats}
      WHERE ${chats.createdAt} >= ${startDateString}
        AND ${chats.createdAt} <= ${endDateString}
        AND ${chats.role} = 'user'
    `);
    
    const totalMessages = Number(messageMetrics[0]?.totalMessages) || 0;
    const totalConversations = Number(messageMetrics[0]?.totalConversations) || 0;
    const messagesPerConversation = totalConversations > 0 
      ? Math.round((totalMessages / totalConversations) * 10) / 10 
      : 0;
    
    // 4. Get busiest day of week
    const busiestDays = await db.execute(sql`
      SELECT
        to_char(${chats.createdAt}, 'Day') as "dayOfWeek",
        COUNT(DISTINCT ${chats.conversationId}) as "conversations"
      FROM ${chats}
      WHERE ${chats.createdAt} >= ${startDateString}
        AND ${chats.createdAt} <= ${endDateString}
        AND ${chats.role} = 'user'
      GROUP BY to_char(${chats.createdAt}, 'Day')
      ORDER BY "conversations" DESC
      LIMIT 1
    `);
    
    // 5. Get completion/success rate based on ratings (if available)
    const ratingsData = await db.execute(sql`
      SELECT
        COUNT(*) as "totalRated",
        SUM(CASE WHEN ${chats.rating} = 'up' THEN 1 ELSE 0 END) as "highRatings"
      FROM ${chats}
      WHERE ${chats.createdAt} >= ${startDateString}
        AND ${chats.createdAt} <= ${endDateString}
        AND ${chats.rating} IS NOT NULL
    `);
    
    const totalRated = Number(ratingsData[0]?.totalRated) || 0;
    const highRatings = Number(ratingsData[0]?.highRatings) || 0;
    const satisfactionRate = totalRated > 0 
      ? Math.round((highRatings / totalRated) * 100) 
      : 0;
    
    // 6. Get flagged conversations (low ratings - 'down')
    const flaggedConversations = await db.execute(sql`
      SELECT
        ${chats.conversationId} as "conversationId",
        MIN(${chats.createdAt}) as "startTime",
        ${chats.topic} as "topic",
        'down' as "rating"
      FROM ${chats}
      WHERE ${chats.createdAt} >= ${startDateString}
        AND ${chats.createdAt} <= ${endDateString}
        AND ${chats.rating} = 'down'
      GROUP BY ${chats.conversationId}, ${chats.topic}
      ORDER BY "startTime" DESC
      LIMIT 3
    `);
    
    // Format the flagged conversations
    const flagged = flaggedConversations.map((convo: any) => {
      // Ensure we have a valid date
      let dateStr = 'Unknown date';
      try {
        if (convo.startTime) {
          dateStr = new Date(convo.startTime).toLocaleDateString();
        }
      } catch (e) {
        console.error('Error formatting date:', e);
      }
      
      return {
        id: convo.conversationId,
        date: dateStr,
        topic: convo.topic || 'General Question',
        rating: 'down'
      };
    });
    
    // Calculate growth rate (comparing to previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    
    const previousPeriodData = await db.execute(sql`
      SELECT
        COUNT(DISTINCT ${chats.conversationId}) as "conversations"
      FROM ${chats}
      WHERE ${chats.createdAt} >= ${previousPeriodStart.toISOString()}
        AND ${chats.createdAt} < ${startDateString}
        AND ${chats.role} = 'user'
    `);
    
    const previousConversations = Number(previousPeriodData[0]?.conversations) || 0;
    let growthRate = 0;
    
    if (previousConversations > 0) {
      growthRate = Math.round(((totalConversations - previousConversations) / previousConversations) * 100);
    } else if (totalConversations > 0) {
      growthRate = 100; // If no previous conversations but we have some now
    }
    
    // Get the busiest day and ensure it's a string before trimming
    let busiestDay = 'n/a';
    if (busiestDays && busiestDays[0] && typeof busiestDays[0].dayOfWeek === 'string') {
      busiestDay = busiestDays[0].dayOfWeek.trim();
    }
    
    // Return all metrics
    return NextResponse.json({
      timeframe: {
        days,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      engagement: {
        activeUsers: uniqueUsers,
        totalConversations,
        totalMessages,
        messagesPerConversation,
        growthRate
      },
      satisfaction: {
        satisfactionRate,
        totalRated
      },
      topics: topTopics.map((t: any) => ({
        name: t.topic || 'Uncategorized',
        count: Number(t.count) // Ensure count is a number
      })),
      patterns: {
        busiestDay
      },
      flagged
    });
  } catch (error) {
    console.error('Error fetching key metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch key metrics', 
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error' 
          : undefined 
      }, 
      { status: 500 }
    );
  }
} 