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
    // Validate conversation ID
    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversation ID' }, 
        { status: 400 }
      );
    }

    // Validate conversationId format (assuming UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' }, 
        { status: 400 }
      );
    }

    // Get user ID with error handling
    let userId: string;
    try {
      userId = await getUserId();
      if (!userId) {
        return NextResponse.json(
          { error: 'User authentication required' }, 
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Error getting user ID during conversation deletion:', error);
      return NextResponse.json(
        { error: 'Authentication error', details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined }, 
        { status: 401 }
      );
    }

    try {
      // Delete all messages in the conversation
      const result = await db
        .delete(chats)
        .where(
          eq(chats.conversationId, conversationId)
        );
      
      // Check if any rows were affected (if not, conversation may not exist)
      // Note: Different database clients might return different result structures
      // We'll safely check for affected rows using optional chaining
      const rowsAffected = (result as any)?.rowsAffected || 0;
      if (rowsAffected === 0) {
        return NextResponse.json(
          { warning: 'No messages found for this conversation' }, 
          { status: 200 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      
      // Database connection errors
      if (error instanceof Error && 
          (error.message.includes('database') || error.message.includes('connection'))) {
        return NextResponse.json(
          { error: 'Database connection error, please try again later' }, 
          { status: 503 }
        );
      }
      
      // Access/permission errors
      if (error instanceof Error && 
          (error.message.includes('permission') || error.message.includes('access'))) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this conversation' }, 
          { status: 403 }
        );
      }
      
      // Default database error
      return NextResponse.json(
        { error: 'Failed to delete conversation', details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined }, 
        { status: 500 }
      );
    }
  } catch (error) {
    // Catch-all for any other unhandled errors
    console.error('Unhandled error in conversation deletion API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 