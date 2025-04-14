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
    
    // Build query filters for user messages
    const userFilters = [];
    
    // Search filter
    if (search) {
      userFilters.push(sql`(
        ${chats.content} LIKE ${'%' + search + '%'} OR
        ${chats.userId} LIKE ${'%' + search + '%'} OR
        ${chats.conversationId} LIKE ${'%' + search + '%'}
      )`);
    }
    
    // Date range filter - using prepared statements with string literals
    if (startDateParam) {
      userFilters.push(sql`${chats.createdAt} >= ${startDateParam}`);
    }
    
    if (endDateParam) {
      userFilters.push(sql`${chats.createdAt} <= ${endDateParam}`);
    }
    
    // Conversation ID filter
    if (conversationId) {
      userFilters.push(sql`${chats.conversationId} = ${conversationId}`);
    }
    
    // Only fetch user queries (not system or assistant responses)
    userFilters.push(sql`${chats.role} = 'user'`);

    // First, we need to approach this differently if rating is specified
    // Since ratings are on assistant messages, we need to find all assistant messages with the rating
    // then fetch their corresponding user messages
    if (rating && rating !== 'all') {
      // Step 1: Find all assistant messages with the specified rating
      const ratingFilters = [];
      ratingFilters.push(sql`${chats.role} = 'assistant'`);
      
      if (rating === 'none') {
        ratingFilters.push(sql`${chats.rating} IS NULL`);
      } else if (rating === 'up' || rating === 'down') {
        ratingFilters.push(sql`${chats.rating} = ${rating}`);
      }
      
      const ratedMessagesQuery = db
        .select({
          id: chats.id,
          conversationId: chats.conversationId,
          createdAt: chats.createdAt,
          rating: chats.rating,
          content: chats.content,
          toolInvocations: chats.toolInvocations,
          topic: chats.topic,
          reasoning: chats.reasoning,
          deleted: chats.deleted
        })
        .from(chats)
        .where(ratingFilters.length === 1 
          ? ratingFilters[0] 
          : sql`${ratingFilters[0]} AND ${ratingFilters[1]}`)
        .orderBy(desc(chats.createdAt))
        .limit(limit)
        .offset(offset);

      // Execute the query
      const ratedMessages = await ratedMessagesQuery;
      
      // No need to continue if no messages match the rating filter
      if (ratedMessages.length === 0) {
        return NextResponse.json({
          logs: [],
          total: 0,
          limit,
          offset,
        });
      }
      
      // Get total count of assistant messages with the rating
      const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(chats)
        .where(ratingFilters.length === 1 
          ? ratingFilters[0] 
          : sql`${ratingFilters[0]} AND ${ratingFilters[1]}`);
      
      // For each rated assistant message, find the preceding user message
      const logsWithResponses = await Promise.all(ratedMessages.map(async (assistantMessage) => {
        // Find the user message that preceded this assistant message
        const userQueryFilters = [];
        userQueryFilters.push(sql`${chats.conversationId} = ${assistantMessage.conversationId}`);
        userQueryFilters.push(sql`${chats.role} = 'user'`);
        userQueryFilters.push(sql`${chats.createdAt} < ${typeof assistantMessage.createdAt === 'object' 
          ? assistantMessage.createdAt.toISOString() 
          : String(assistantMessage.createdAt)}`);
        
        const userMessageQuery = userQueryFilters.length <= 1 
          ? userQueryFilters[0] 
          : sql`${userQueryFilters[0]} AND ${userQueryFilters[1]} AND ${userQueryFilters[2]}`;
        
        const [userMessage] = await db
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
            topic: chats.topic,
            deleted: chats.deleted,
          })
          .from(chats)
          .where(userMessageQuery)
          .orderBy(desc(chats.createdAt))
          .limit(1);

        // Skip if no user message was found
        if (!userMessage) {
          return null;
        }

        // Extract topic from tool invocations if available
        let topic = userMessage.topic || assistantMessage.topic || '';
        
        if (!topic && assistantMessage.toolInvocations?.length) {
          const toolInvocation = assistantMessage.toolInvocations[0];
          if (toolInvocation.result && Array.isArray(toolInvocation.result)) {
            if (toolInvocation.result.length > 0 && toolInvocation.result[0].topic) {
              topic = toolInvocation.result[0].topic;
            }
          } else if (toolInvocation.result?.topic) {
            topic = toolInvocation.result.topic;
          }
        }

        const dateTime = typeof userMessage.createdAt === 'object' && userMessage.createdAt instanceof Date
          ? userMessage.createdAt.toISOString()
          : String(userMessage.createdAt);

        return {
          id: userMessage.id,
          dateTime,
          user: userMessage.user || 'Anonymous',
          query: userMessage.content,
          response: assistantMessage.content || 'No response found',
          topic,
          conversationId: userMessage.conversationId,
          userAgent: userMessage.userAgent,
          userIp: userMessage.userIp,
          userToolInvocations: userMessage.toolInvocations || [],
          assistantToolInvocations: assistantMessage.toolInvocations || [],
          rating: assistantMessage.rating,
          reasoning: assistantMessage.reasoning,
          deleted: userMessage.deleted || assistantMessage.deleted,
        };
      }));

      // Filter out any null entries (where no user message was found)
      const validLogs = logsWithResponses.filter(log => log !== null);

      return NextResponse.json({
        logs: validLogs,
        total: count,
        limit,
        offset,
      });
    } else {
      // Original flow for when rating is not specified
      // Create the SQL query combining all user filters
      const userQuery = userFilters.length <= 1 
        ? userFilters[0] 
        : sql`${userFilters.join(' AND ')}`;
      
      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(chats)
        .where(userQuery);

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
          deleted: chats.deleted,
        })
        .from(chats)
        .where(userQuery)
        .orderBy(desc(chats.createdAt))
        .limit(limit)
        .offset(offset);

      // If we have no logs but a specific conversationId was requested,
      // try again without filtering by role or deleted status
      if (logs.length === 0 && conversationId) {
        const specificConversationLogs = await db
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
            deleted: chats.deleted,
            role: chats.role,
            reasoning: chats.reasoning,
          })
          .from(chats)
          .where(sql`${chats.conversationId} = ${conversationId}`)
          .orderBy(chats.createdAt)
          .limit(10);

        // If we found any messages (regardless of role), pick the first user message
        if (specificConversationLogs.length > 0) {
          // Try to find a user message
          const userMessage = specificConversationLogs.find(msg => msg.role === 'user');
          
          if (userMessage) {
            // Use the user message as our log entry
            const assistantMessage = specificConversationLogs.find(msg => 
              msg.role === 'assistant' && new Date(msg.createdAt) > new Date(userMessage.createdAt)
            );
            
            return NextResponse.json({
              logs: [{
                id: userMessage.id,
                dateTime: typeof userMessage.createdAt === 'object' ? userMessage.createdAt.toISOString() : String(userMessage.createdAt),
                user: userMessage.user || 'Anonymous',
                query: userMessage.content,
                response: assistantMessage?.content || 'No response found',
                topic: userMessage.topic || assistantMessage?.topic || '',
                conversationId: userMessage.conversationId,
                userAgent: userMessage.userAgent,
                userIp: userMessage.userIp,
                userToolInvocations: userMessage.toolInvocations || [],
                assistantToolInvocations: assistantMessage?.toolInvocations || [],
                rating: assistantMessage?.rating,
                reasoning: assistantMessage?.reasoning,
                deleted: userMessage.deleted || (assistantMessage?.deleted || false),
              }],
              total: 1,
              limit,
              offset,
            });
          }
        }
      }

      // For each user message, get the corresponding assistant response
      // IMPORTANT: We don't filter by deleted status for assistant messages
      // so we can see deleted responses paired with non-deleted user messages
      const logsWithResponses = await Promise.all(logs.map(async (log) => {
        const createdAtStr = typeof log.createdAt === 'object' 
          ? log.createdAt.toISOString() 
          : String(log.createdAt);
          
        // Only filter by conversation, role and creation time
        // Note: We do not filter by deleted status here
        const assistantQuery = sql`
          ${chats.conversationId} = ${log.conversationId} AND
          ${chats.role} = 'assistant' AND
          ${chats.createdAt} > ${createdAtStr}
        `;
          
        const [response] = await db
          .select({
            id: chats.id,
            content: chats.content,
            createdAt: chats.createdAt,
            toolInvocations: chats.toolInvocations,
            topic: chats.topic,
            rating: chats.rating,
            reasoning: chats.reasoning,
            deleted: chats.deleted,
          })
          .from(chats)
          .where(assistantQuery)
          .orderBy(chats.createdAt)
          .limit(1);

        // Extract topic from tool invocations if available
        let topic = log.topic || '';
        
        if (!topic && response) {
          if (response.topic) {
            topic = response.topic;
          }
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
          userToolInvocations: log.toolInvocations || [],
          assistantToolInvocations: response?.toolInvocations || [],
          rating: response?.rating || log.rating,
          reasoning: response?.reasoning,
          deleted: log.deleted || (response?.deleted || false),
        };
      }));

      return NextResponse.json({
        logs: logsWithResponses,
        total: count,
        limit,
        offset,
      });
    }
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