// app/api/chat/history/route.ts
import { NextResponse } from 'next/server';
import { getConversationMessages } from '@/lib/actions/chats';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId parameter' }, { status: 400 });
    }

    // Validate UUID format
    if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversationId format' }, { status: 400 });
    }

    const messages = await getConversationMessages(conversationId);
    
    // Transform messages to match the AI SDK's format
    const formattedMessages = messages.map(msg => {
      // Type assertion to access possible non-standard field names
      const rawMsg = msg as any;
      
      // Process tool invocations from either field name
      let invocations = msg.toolInvocations || [];
      
      // If data is in snake_case format
      if (!invocations.length && rawMsg.tool_invocations) {
        const rawInvocations = rawMsg.tool_invocations;
        invocations = typeof rawInvocations === 'string' 
          ? JSON.parse(rawInvocations) 
          : rawInvocations;
      }
      
      // Normalize tool invocations format
      const toolInvocations = invocations.map((tool: any, index: number) => ({
        toolName: tool.toolName || 'unknown',
        toolCallId: tool.toolCallId || `call_${crypto.randomUUID().replace(/-/g, '')}`,
        state: tool.state || 'result',
        step: tool.step ?? index,
        args: tool.args || {},
        result: tool.result
      }));

      return {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        rating: msg.rating,
        toolInvocations,
      };
    });

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error in chat history API:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation history' }, 
      { status: 500 }
    );
  }
}