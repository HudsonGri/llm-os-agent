import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/chats';
import { desc, eq, like, sql, and, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic'; // Disable caching for this route

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const rating = searchParams.get('rating');
    const conversationId = searchParams.get('conversationId');

    // Build query filters
    let filters = [];
    
    // Search filter
    if (search) {
      filters.push(
        or(
          like(chats.content, `%${search}%`),
          like(chats.userId, `%${search}%`),
          like(chats.conversationId, `%${search}%`)
        )
      );
    }
    
    // Date range filter - using prepared statements with string literals
    if (startDateParam) {
      // safer way to handle date strings in SQL
      filters.push(sql`${chats.createdAt} >= ${startDateParam}`);
    }
    
    if (endDateParam) {
      // safer way to handle date strings in SQL
      filters.push(sql`${chats.createdAt} <= ${endDateParam}`);
    }
    
    // Conversation ID filter
    if (conversationId) {
      filters.push(eq(chats.conversationId, conversationId));
    }
    
    // Only fetch user queries (not system or assistant responses)
    filters.push(eq(chats.role, 'user'));

    // For rating filter, we'll handle it differently since ratings are typically on assistant messages
    // We'll first get all user messages without filtering by rating
    
    // Get total count for pagination (without rating filter)
    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(chats)
      .where(filters.length ? and(...filters) : undefined);

    // Fetch data with pagination
    const logs = await db
      .select({
        id: chats.id,
        conversationId: chats.conversationId,
        user: chats.userId,
        userAgent: chats.userAgent,
        userIp: chats.userIp,
        content: chats.content,
        createdAt: chats.createdAt,
        tokenCount: chats.tokenCount,
        processingTime: chats.processingTime,
        toolInvocations: chats.toolInvocations,
        rating: chats.rating,
        topic: chats.topic,
      })
      .from(chats)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(chats.createdAt))
      .limit(limit)
      .offset(offset);

    // For each user message, get the corresponding assistant response
    let logsWithResponses = await Promise.all(logs.map(async (log) => {
      // Ensure createdAt is a string for safe SQL comparison
      const createdAtStr = typeof log.createdAt === 'object' 
        ? log.createdAt.toISOString() 
        : String(log.createdAt);
        
      // Find the next message in the conversation (which should be the assistant's response)
      const [response] = await db
        .select({
          id: chats.id,
          content: chats.content,
          createdAt: chats.createdAt,
          toolInvocations: chats.toolInvocations,
          topic: chats.topic,
          rating: chats.rating,
        })
        .from(chats)
        .where(
          and(
            eq(chats.conversationId, log.conversationId),
            eq(chats.role, 'assistant'),
            sql`${chats.createdAt} > ${createdAtStr}`
          )
        )
        .orderBy(chats.createdAt)
        .limit(1);

      // Extract topic from tool invocations if available
      let topic = log.topic || '';
      
      // If no topic from the log, try to get it from the response or tool invocations
      if (!topic && response) {
        // First check if response has a topic
        if (response.topic) {
          topic = response.topic;
        }
        // If not, try to extract from tool invocations
        else if (response.toolInvocations?.length) {
          const toolInvocation = response.toolInvocations[0];
          if (toolInvocation.result && Array.isArray(toolInvocation.result)) {
            if (toolInvocation.result.length > 0 && toolInvocation.result[0].topic) {
              topic = toolInvocation.result[0].topic;
            }
          } else if (toolInvocation.result?.topic) {
            topic = toolInvocation.result.topic;
          }
        }
      }

      // Format the date consistently for the response
      const dateTime = typeof log.createdAt === 'object' && log.createdAt instanceof Date
        ? log.createdAt.toISOString()
        : String(log.createdAt);

      return {
        id: log.id,
        dateTime,
        user: log.user || 'Anonymous',
        query: log.content,
        response: response?.content || 'No response found',
        topic,
        conversationId: log.conversationId,
        userAgent: log.userAgent,
        userIp: log.userIp,
        // Include tool invocations data
        userToolInvocations: log.toolInvocations || [],
        assistantToolInvocations: response?.toolInvocations || [],
        rating: response?.rating || log.rating,
      };
    }));

    // Apply rating filter after we have the assistant responses
    if (rating && rating !== 'all') {
      if (rating === 'up' || rating === 'down') {
        logsWithResponses = logsWithResponses.filter(log => log.rating === rating);
      } else if (rating === 'none') {
        logsWithResponses = logsWithResponses.filter(log => !log.rating);
      }
    }

    // Update the count if we applied a rating filter
    const filteredCount = rating && rating !== 'all' ? logsWithResponses.length : count;

    return NextResponse.json({
      logs: logsWithResponses,
      total: filteredCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin logs', 
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error' 
          : undefined 
      }, 
      { status: 500 }
    );
  }
} 