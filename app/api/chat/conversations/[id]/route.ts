import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/chats';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/actions/chats';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const conversationId = params.id;

    // Delete all messages in the conversation
    await db
      .delete(chats)
      .where(
        eq(chats.conversationId, conversationId)
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
} 