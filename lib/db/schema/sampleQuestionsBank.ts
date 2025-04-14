import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const sampleQuestionsBank = pgTable('sample_questions_bank', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  category: text('category').notNull(),
  position: integer('position').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for type validation
export const insertSampleQuestionBankSchema = createInsertSchema(sampleQuestionsBank);
export const selectSampleQuestionBankSchema = createSelectSchema(sampleQuestionsBank);

export type SampleQuestionBank = z.infer<typeof selectSampleQuestionBankSchema>;
export type NewSampleQuestionBank = z.infer<typeof insertSampleQuestionBankSchema>; 