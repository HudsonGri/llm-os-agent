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
      const formattedMessages = messages.map(msg => {
        // Ensure tool invocations have the required fields
        const toolInvocations = msg.toolInvocations ? msg.toolInvocations.map((tool: any, index: number) => ({
          toolName: tool.toolName || 'unknown',
          toolCallId: tool.toolCallId || `call_${crypto.randomUUID().replace(/-/g, '')}`,
          state: tool.state || 'result',
          step: tool.step !== undefined ? tool.step : index,
          args: tool.args || {},
          result: tool.result
        })) : [];

        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          rating: msg.rating,
          toolInvocations: toolInvocations,
        };
      });

      return NextResponse.json(formattedMessages);
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return NextResponse.json(
        { error: 'Failed to get conversation history' }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in chat history API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}