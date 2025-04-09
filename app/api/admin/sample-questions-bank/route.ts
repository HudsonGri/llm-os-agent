import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sampleQuestionsBank } from '@/lib/db/schema';
import { desc, eq, asc } from 'drizzle-orm';
import { z } from 'zod';

// GET all sample questions bank items
export async function GET(req: NextRequest) {
  try {
    const allBankItems = await db.query.sampleQuestionsBank.findMany({
      where: eq(sampleQuestionsBank.isActive, 1),
      orderBy: [
        asc(sampleQuestionsBank.category),
        asc(sampleQuestionsBank.position),
      ],
    });
    
    return NextResponse.json({ bankItems: allBankItems });
  } catch (error) {
    console.error('Error fetching sample questions bank:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample questions bank' },
      { status: 500 }
    );
  }
}

// Schema for creating/updating bank items
const bankItemSchema = z.object({
  id: z.number().optional(),
  question: z.string().min(1, 'Question is required'),
  category: z.string().min(1, 'Category is required'),
  position: z.number().default(0),
  isActive: z.number().default(1)
});

// POST new bank item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bankItem = bankItemSchema.parse(body);
    
    if (bankItem.id) {
      // Update existing item
      const updated = await db.update(sampleQuestionsBank)
        .set({
          question: bankItem.question,
          category: bankItem.category,
          position: bankItem.position,
          isActive: bankItem.isActive,
          updatedAt: new Date()
        })
        .where(eq(sampleQuestionsBank.id, bankItem.id))
        .returning();
        
      return NextResponse.json({ success: true, bankItem: updated[0] });
    } else {
      // Create new item
      const inserted = await db.insert(sampleQuestionsBank)
        .values({
          question: bankItem.question,
          category: bankItem.category,
          position: bankItem.position,
          isActive: bankItem.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      return NextResponse.json({ success: true, bankItem: inserted[0] });
    }
  } catch (error) {
    console.error('Error saving bank item:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save bank item' },
      { status: 500 }
    );
  }
}

// DELETE a bank item (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }
    
    // Soft delete - set isActive to 0
    await db.update(sampleQuestionsBank)
      .set({
        isActive: 0,
        updatedAt: new Date()
      })
      .where(eq(sampleQuestionsBank.id, parseInt(id)));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank item:', error);
    return NextResponse.json(
      { error: 'Failed to delete bank item' },
      { status: 500 }
    );
  }
} 