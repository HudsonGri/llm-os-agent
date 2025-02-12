import { db } from '@/lib/db';
import { chats, type Chat, type NewChat } from '@/lib/db/schema/chats';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function createChatMessage(data: Omit<NewChat, 'id' | 'createdAt' | 'updatedAt'>) {
  const [chat] = await db.insert(chats).values({
    ...data,
    id: createId(),
  }).returning();
  return chat;
}

export async function updateChatRating(messageId: string, rating: 'up' | 'down' | null) {
  const [chat] = await db
    .update(chats)
    .set({ 
      rating,
      ratedAt: rating ? new Date() : null,
    })
    .where(eq(chats.id, messageId))
    .returning();
  return chat;
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