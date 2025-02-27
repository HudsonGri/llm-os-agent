import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/chats';
import { sql, min } from 'drizzle-orm';

export const dynamic = 'force-dynamic'; // Disable caching for this route

// Helper function to format a date to YYYY-MM-DD string
function formatDateToYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper function to format a date for display
function formatDateForDisplay(date: Date, rangeSize: number): string {
  if (rangeSize > 365) {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  } else if (rangeSize > 60) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') ? parseInt(searchParams.get('days') as string, 10) : null;
    
    // Set end date to the end of today
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    // Determine start date based on the request
    let startDate: Date;
    if (days !== null) {
      startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1); // Include today
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Query the database for the oldest conversation date
      const oldestChatResult = await db.select({
        oldest: min(chats.createdAt)
      }).from(chats);
      
      if (oldestChatResult[0]?.oldest) {
        startDate = new Date(oldestChatResult[0].oldest);
      } else {
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      startDate.setHours(0, 0, 0, 0);
    }
    
    // Query for conversation counts by day
    const dailyEngagementData = await db.execute(sql`
      SELECT 
        DATE(${chats.createdAt}) as date,
        COUNT(DISTINCT ${chats.conversationId}) as conversations,
        COUNT(*) as messages
      FROM ${chats}
      WHERE ${chats.createdAt} >= ${startDate.toISOString()}
        AND ${chats.createdAt} <= ${endDate.toISOString()}
        AND ${chats.role} = 'user'
      GROUP BY DATE(${chats.createdAt})
      ORDER BY date ASC
    `);
    
    // Map database results to lookup objects
    const dataByDate: Record<string, { conversations: number; messages: number }> = {};
    
    dailyEngagementData.forEach((row: any) => {
      if (row.date) {
        // Ensure consistent date format (YYYY-MM-DD)
        const dateKey = typeof row.date === 'string' 
          ? row.date.split('T')[0] 
          : formatDateToYMD(new Date(row.date));
        
        dataByDate[dateKey] = {
          conversations: Number(row.conversations) || 0,
          messages: Number(row.messages) || 0
        };
      }
    });
    
    // Calculate the total days in the range
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate the date points we need, limiting for large ranges
    const datePoints: Date[] = [];
    const maxPoints = 100; // Maximum number of points to show
    const step = Math.max(1, Math.ceil(daysDiff / maxPoints));
    
    // Generate evenly spaced dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      datePoints.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + step);
    }
    
    // Ensure the end date is included if not already
    if (datePoints.length > 0 && 
        formatDateToYMD(datePoints[datePoints.length - 1]) !== formatDateToYMD(endDate)) {
      datePoints.push(new Date(endDate));
    }
    
    // Build the final data array with properly formatted dates
    const formattedData = datePoints.map(date => {
      const dateKey = formatDateToYMD(date);
      const data = dataByDate[dateKey] || { conversations: 0, messages: 0 };
      
      return {
        date: formatDateForDisplay(date, daysDiff),
        dateKey, // Include the raw date key for deduplication
        conversations: data.conversations,
        messages: data.messages
      };
    });
    
    // Remove duplicate dates (keeping the one with data if possible)
    const deduplicated = formattedData.reduce((acc: any[], current) => {
      // Check if we already have this date in our results
      const existingIndex = acc.findIndex(item => item.date === current.date);
      
      if (existingIndex === -1) {
        // This date isn't in results yet, add it
        acc.push(current);
      } else if ((current.conversations > 0 || current.messages > 0) && 
                 (acc[existingIndex].conversations === 0 && acc[existingIndex].messages === 0)) {
        // Replace existing zero-count entry with this one that has data
        acc[existingIndex] = current;
      }
      // Otherwise keep the existing entry
      
      return acc;
    }, []);
    
    // Calculate the totals
    let totalConversations = 0;
    let totalMessages = 0;
    
    Object.values(dataByDate).forEach(data => {
      totalConversations += data.conversations;
      totalMessages += data.messages;
    });
    
    // Final cleanup - remove the dateKey field we used for deduplication
    const finalData = deduplicated.map(({ date, conversations, messages }) => ({ 
      date, 
      conversations, 
      messages 
    }));
    
    return NextResponse.json({
      data: finalData,
      totalConversations,
      totalMessages
    });
  } catch (error) {
    console.error('Error fetching engagement data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch engagement data', 
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error' 
          : undefined 
      }, 
      { status: 500 }
    );
  }
} 