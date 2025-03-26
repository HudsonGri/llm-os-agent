// app/api/chat/history/route.ts
import { NextResponse } from 'next/server';
import { getConversationMessages } from '@/lib/actions/chats';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId parameter' }, 
        { status: 400 }
      );
    }

    // Validate conversationId format (assuming UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversationId format' }, 
        { status: 400 }
      );
    }

    try {
      const messages = await getConversationMessages(conversationId);
      
      // Transform messages to match the AI SDK's format
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        rating: msg.rating,
        toolInvocations: msg.toolInvocations || [],
      }));

      return NextResponse.json(formattedMessages);
    } catch (error) {
      console.error(`Error fetching chat history for conversation ${conversationId}:`, error);
      
      // Check if it's a "not found" error
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Conversation not found' }, 
          { status: 404 }
        );
      }
      
      // Database connection errors
      if (error instanceof Error && 
          (error.message.includes('database') || error.message.includes('connection'))) {
        return NextResponse.json(
          { error: 'Database connection error, please try again later' }, 
          { status: 503 }
        );
      }
      
      // Default server error
      return NextResponse.json(
        { error: 'Failed to fetch chat history', details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined }, 
        { status: 500 }
      );
    }
  } catch (error) {
    // Catch any errors in the URL parsing or other outer code
    console.error('Unhandled error in chat history API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}