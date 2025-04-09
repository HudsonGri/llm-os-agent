import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sampleQuestions, insertSampleQuestionSchema } from '@/lib/db/schema';
import { desc, eq, sql, notInArray } from 'drizzle-orm';
import { z } from 'zod';

// GET all sample questions
export async function GET(req: NextRequest) {
  try {
    const allQuestions = await db.query.sampleQuestions.findMany({
      orderBy: (sampleQuestions) => [sampleQuestions.position],
    });
    
    return NextResponse.json({ questions: allQuestions });
  } catch (error) {
    console.error('Error fetching sample questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample questions' },
      { status: 500 }
    );
  }
}

// Schema for bulk-updating questions
const updateQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number().optional(),
      question: z.string().min(1, 'Question is required'),
      category: z.string().nullable().transform(val => val || 'General'),
      position: z.number().min(0),
      isActive: z.number().default(1)
    })
  )
});

// POST new questions (bulk create/update)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questions } = updateQuestionsSchema.parse(body);
    
    // Begin transaction for bulk operations
    const result = await db.transaction(async (tx) => {
      // Clear existing active questions if we're replacing all
      if (body.replaceAll) {
        await tx.update(sampleQuestions)
          .set({ isActive: 0 })
          .where(eq(sampleQuestions.isActive, 1));
      }
      
      // Get existing question IDs to handle deletions
      const existingQuestionIds = questions
        .filter(q => q.id !== undefined)
        .map(q => q.id as number);
      
      // Delete questions not included in this request
      if (existingQuestionIds.length > 0) {
        await tx.delete(sampleQuestions)
          .where(
            sql`${sampleQuestions.id} NOT IN (${sql.join(existingQuestionIds.map(id => sql`${id}`), sql`, `)})`
          );
      } else if (body.deleteAll) {
        // If no IDs provided and deleteAll flag is true, delete all questions
        await tx.delete(sampleQuestions);
      }
      
      // Process each question (create or update)
      const processed = [];
      
      for (const q of questions) {
        if (q.id) {
          // Update existing question
          const updated = await tx.update(sampleQuestions)
            .set({
              question: q.question,
              category: q.category,
              position: q.position,
              isActive: q.isActive,
              updatedAt: new Date()
            })
            .where(eq(sampleQuestions.id, q.id))
            .returning();
            
          processed.push(updated[0]);
        } else {
          // Create new question
          const inserted = await tx.insert(sampleQuestions)
            .values({
              question: q.question,
              category: q.category,
              position: q.position,
              isActive: q.isActive,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();
            
          processed.push(inserted[0]);
        }
      }
      
      return processed;
    });
    
    return NextResponse.json({ 
      success: true, 
      questions: result 
    });
  } catch (error) {
    console.error('Error saving sample questions:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save sample questions' },
      { status: 500 }
    );
  }
}

// DELETE a sample question
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }
    
    await db.delete(sampleQuestions)
      .where(eq(sampleQuestions.id, parseInt(id)));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sample question:', error);
    return NextResponse.json(
      { error: 'Failed to delete sample question' },
      { status: 500 }
    );
  }
} 