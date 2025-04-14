import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const sampleQuestions = pgTable('sample_questions', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  category: text('category'),
  position: integer('position').notNull(),
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for type validation
export const insertSampleQuestionSchema = createInsertSchema(sampleQuestions);
export const selectSampleQuestionSchema = createSelectSchema(sampleQuestions);

export type SampleQuestion = z.infer<typeof selectSampleQuestionSchema>;
export type NewSampleQuestion = z.infer<typeof insertSampleQuestionSchema>; 