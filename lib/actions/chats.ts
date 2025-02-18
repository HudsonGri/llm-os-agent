'use server'
import { db } from '@/lib/db';
import { chats, type Chat, type NewChat } from '@/lib/db/schema/chats';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { cookies } from 'next/headers';
import { Message } from 'ai';

// Function to get or create a user ID
export async function getUserId() {
  const cookieStore = cookies();
  let userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    userId = createId();
    cookieStore.set('userId', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });
  }
  
  return userId;
}

// Function to create a new conversation
export async function createConversation() {
  return createId();
}

// Enhanced function to save chat messages
export async function createChatMessage(data: Omit<NewChat, 'createdAt' | 'updatedAt'>) {
  const [chat] = await db.insert(chats).values({
    ...data,
  }).returning();
  return chat;
}

// Function to save a message with all metadata
export async function saveMessage({
  id,
  role,
  content,
  conversationId,
  parentMessageId,
  toolInvocations,
  userAgent,
  userIp,
  tokenCount,
  processingTime
}: {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  conversationId: string;
  parentMessageId?: string;
  toolInvocations?: any;
  userAgent?: string;
  userIp?: string;
  tokenCount?: number;
  processingTime?: number;
}) {
  const userId = await getUserId();
  
  return await createChatMessage({
    id,
    userId,
    userIp: userIp || '',
    userAgent: userAgent || '',
    role,
    content,
    conversationId,
    parentMessageId,
    toolInvocations,
    tokenCount,
    processingTime
  });
}

export async function getConversationMessages(conversationId: string) {
  return await db
    .select()
    .from(chats)
    .where(eq(chats.conversationId, conversationId))
    .orderBy(chats.createdAt);
}

export async function getMessageById(messageId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, messageId));
  return chat;
}

export async function updateChatRating(messageId: string, rating: 'up' | 'down' | null) {
  console.log('Updating chat rating for messageId:', messageId, 'with rating:', rating);
  const [chat] = await db
    .update(chats)
    .set({ 
      rating,
      ratedAt: rating ? new Date() : null
    })
    .where(eq(chats.id, messageId))
    .returning();
  console.log('Updated chat rating:', chat);
  return chat;
}

export async function getConversationStats(conversationId: string) {
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
} 