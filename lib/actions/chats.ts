'use server'

import { db } from '@/lib/db';
import { chats, type Chat, type NewChat } from '@/lib/db/schema/chats';
import { eq, desc, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { cookies } from 'next/headers';
import { Message } from 'ai';
import { tagMessageContent } from '@/lib/ai/topic-tagger';

// Types
type MessageRole = 'user' | 'assistant' | 'system' | 'data';

interface ToolInvocation {
  toolName: string;
  state?: string;
  step?: number;
  toolCallId?: string;
  args?: {
    question?: string;
    topic?: string;
    topicNumber?: number;
  };
  result?: any;
}

interface SaveMessageParams {
  id: string;
  role: MessageRole;
  content: string;
  conversationId: string;
  parentMessageId?: string;
  toolInvocations?: ToolInvocation[];
  userAgent?: string;
  userIp?: string;
  tokenCount?: number;
  processingTime?: number;
  messages?: Message[];
  reasoning?: boolean;
}

// Constants
const COOKIE_NAME = 'userId';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Helper Functions
const createCookie = (userId: string) => {
  cookies().set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE
  });
};

// Main Functions
export async function getUserId(): Promise<string> {
  const cookieStore = cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  
  if (userId) return userId;
  
  const newUserId = createId();
  createCookie(newUserId);
  return newUserId;
}

export async function createConversation(): Promise<string> {
  return createId();
}

export async function createChatMessage(data: NewChat): Promise<Chat> {
  try {
    const [chat] = await db.insert(chats)
      .values({
        id: data.id,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        userId: data.userId,
        userIp: data.userIp || '',
        userAgent: data.userAgent || '',
        parentMessageId: data.parentMessageId,
        toolInvocations: data.toolInvocations,
        tokenCount: data.tokenCount,
        processingTime: data.processingTime,
        topic: data.topic,
        reasoning: data.reasoning
      })
      .returning();
    return chat;
  } catch (error) {
    console.error('Error creating chat message:', error);
    throw new Error('Failed to create chat message');
  }
}

export async function saveMessage({
  id,
  role,
  content,
  conversationId,
  parentMessageId,
  toolInvocations = [],
  userAgent,
  userIp,
  tokenCount,
  processingTime,
  messages,
  reasoning,
}: SaveMessageParams): Promise<Chat> {
  try {
    const userId = await getUserId();

    // Start topic tagging asynchronously (don't await here to avoid slowing down the response)
    const topicTaggingPromise = (async () => {
      try {
        // Tag all message types with topics (user, assistant, and system)
        const result = await tagMessageContent(content);
        return result.topic;
      } catch (error) {
        console.error('Error tagging message:', error);
        return 'General Question'; // Default fallback
      }
    })();

    if (role === 'assistant') {
      // Retrieve previous assistant message
      const [prevAssistantMessage] = await db
        .select()
        .from(chats)
        .where(eq(chats.conversationId, conversationId))
        .orderBy(desc(chats.createdAt))
        .limit(1);

      if (prevAssistantMessage?.toolInvocations && prevAssistantMessage.role === 'assistant') {
        const lastAssistantMessage = messages?.findLast((m: Message) => m.role === 'assistant');
        
        if (!lastAssistantMessage?.parts) {
          throw new Error('Invalid assistant message format');
        }

        // Get the topic for this message
        const topic = await topicTaggingPromise;

        // Transform tool calls to the correct format
        const transformedToolInvocations = (
          lastAssistantMessage.parts as Array<any>
        ).filter(part => 
          part && typeof part === 'object' && 'toolInvocation' in part && part.toolInvocation
        ).map(part => ({
          toolName: part.toolInvocation.toolName || 'unknown',
          state: part.toolInvocation.state || 'result',
          step: part.toolInvocation.step || 0,
          toolCallId: part.toolInvocation.toolCallId || `call_${createId()}`,
          args: part.toolInvocation.args || {},
          result: part.toolInvocation.result
        }));

        const [updatedChat] = await db
          .update(chats)
          .set({
            content,
            tokenCount: (prevAssistantMessage.tokenCount || 0) + (tokenCount || 0),
            processingTime: (prevAssistantMessage.processingTime || 0) + (processingTime || 0),
            toolInvocations: transformedToolInvocations,
            topic, // Set the topic in the database
            reasoning // Store reasoning flag
          })
          .where(eq(chats.id, prevAssistantMessage.id))
          .returning();
        return updatedChat;
      }
    }

    // Wait for topic tagging to complete
    const topic = await topicTaggingPromise;

    // Transform tool invocations for new messages
    const transformedToolInvocations = toolInvocations.map(tool => ({
      toolName: tool.toolName,
      state: tool.state || 'result',
      step: tool.step || 0,
      toolCallId: tool.toolCallId || `call_${createId()}`,
      args: tool.args || {},
      result: tool.result
    }));

    return await createChatMessage({
      id,
      userId,
      userIp: userIp || '',
      userAgent: userAgent || '',
      role,
      content,
      conversationId,
      parentMessageId,
      toolInvocations: transformedToolInvocations,
      tokenCount,
      processingTime,
      topic, // Add the topic to the created message
      reasoning // Add the reasoning flag
    });
  } catch (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
}

export async function getConversationMessages(conversationId: string): Promise<Chat[]> {
  try {
    const messages = await db
      .select()
      .from(chats)
      .where(eq(chats.conversationId, conversationId))
      .orderBy(asc(chats.createdAt));
    return messages as Chat[];
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw new Error('Failed to fetch conversation messages');
  }
}

export async function getMessageById(messageId: string): Promise<Chat | null> {
  try {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, messageId));
    return chat as Chat | null;
  } catch (error) {
    console.error('Error fetching message:', error);
    throw new Error('Failed to fetch message');
  }
}

export async function updateChatRating(messageId: string, rating: 'up' | 'down' | null): Promise<Chat> {
  try {
    const [chat] = await db
      .update(chats)
      .set({ 
        rating,
        ratedAt: rating ? new Date() : null
      })
      .where(eq(chats.id, messageId))
      .returning();
    return chat;
  } catch (error) {
    console.error('Error updating chat rating:', error);
    throw new Error('Failed to update chat rating');
  }
}

interface ConversationStats {
  messageCount: number;
  assistantMessages: number;
  userMessages: number;
  totalTokens: number;
  totalProcessingTime: number;
  ratings: {
    up: number;
    down: number;
  };
}

export async function getConversationStats(conversationId: string): Promise<ConversationStats> {
  try {
    const messages = await db
      .select({
        role: chats.role,
        tokenCount: chats.tokenCount,
        processingTime: chats.processingTime,
        rating: chats.rating,
      })
      .from(chats)
      .where(eq(chats.conversationId, conversationId));

    return {
      messageCount: messages.length,
      assistantMessages: messages.filter(m => m.role === 'assistant').length,
      userMessages: messages.filter(m => m.role === 'user').length,
      totalTokens: messages.reduce((sum, m) => sum + (m.tokenCount || 0), 0),
      totalProcessingTime: messages.reduce((sum, m) => sum + (m.processingTime || 0), 0),
      ratings: {
        up: messages.filter(m => m.rating === 'up').length,
        down: messages.filter(m => m.rating === 'down').length,
      },
    };
  } catch (error) {
    console.error('Error fetching conversation stats:', error);
    throw new Error('Failed to fetch conversation stats');
  }
}

export async function wasReasoningEnabled(conversationId: string): Promise<boolean> {
  try {
    const messages = await db
      .select({ reasoning: chats.reasoning })
      .from(chats)
      .where(eq(chats.conversationId, conversationId));
    
    // Return true if any message in the conversation had reasoning enabled
    return messages.some(m => m.reasoning === true);
  } catch (error) {
    console.error('Error checking reasoning status:', error);
    // Default to false if there's an error
    return false;
  }
} 