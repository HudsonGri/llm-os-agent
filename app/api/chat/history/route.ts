import { NextResponse } from 'next/server';
import { getConversationMessages } from '@/lib/actions/chats';
import { nanoid } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
  }

  try {
    const messages = await getConversationMessages(conversationId);
    
    // Transform messages to match the AI SDK's format
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      toolInvocations: msg.toolInvocations || [],
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}