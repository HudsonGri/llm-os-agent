import { pgTable, text, timestamp, integer, jsonb, varchar, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

// Declare the table schema without self-references first
const chatsSchema = {
  // Basic info
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id'), // For future auth integration
  userIp: varchar('user_ip', { length: 45 }), // IPv4 or IPv6
  userAgent: text('user_agent'),
  
  // Message content
  role: text('role').$type<'user' | 'assistant' | 'system' | 'data'>().notNull(),
  content: text('content').notNull(),
  
  // Topic classification
  topic: text('topic'), // New column for message topic classification
  
  // Reasoning flag
  reasoning: boolean('reasoning'), // Track if reasoning was enabled for this message
  
  // Tool invocations and results
  toolInvocations: jsonb('tool_invocations').$type<Array<{
    toolName: string;
    result?: {
      topic?: string;
      similarity?: number;
      name?: string;
      filename?: string;
      url?: string;
    } | Array<{
      topic?: string;
      similarity: number;
      name: string;
      filename?: string;
      url?: string;
    }>;
  }>>(),
  
  // Message metadata
  parentMessageId: text('parent_message_id'),
  conversationId: text('conversation_id').notNull(), // Group messages in conversations
  
  // Performance metrics
  tokenCount: integer('token_count'), // Track token usage
  processingTime: integer('processing_time_ms'), // Time taken to generate response
  
  // User feedback
  rating: text('rating').$type<'up' | 'down' | null>(),
  ratedAt: timestamp('rated_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};

// Create the table with the schema
export const chats = pgTable('chats', chatsSchema);

// Now add the foreign key constraint after the table is defined
export const addChatsForeignKey = sql`
  ALTER TABLE "chats" 
  ADD CONSTRAINT "chats_parent_message_id_fkey" 
  FOREIGN KEY ("parent_message_id") 
  REFERENCES "chats" ("id")
`;

// Types for TypeScript
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert; 