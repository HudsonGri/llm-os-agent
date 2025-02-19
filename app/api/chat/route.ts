// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText, tool, smoothStream } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';
import { saveMessage, createConversation } from '@/lib/actions/chats';
import { headers } from 'next/headers';

export const maxDuration = 30;

export async function POST(req: Request) {
  const headersList = headers();
  const { messages, conversationId: existingConversationId } = await req.json();
  
  // Get or create conversation ID
  const conversationId = existingConversationId || await createConversation();
  
  // Get user information
  const userIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
  const userAgent = headersList.get('user-agent') || '';

  // Save the user message first if last message is from user
  const lastUserMessage = messages[messages.length - 1];
  let parentMessage: { id: string } | undefined;
  
  if (lastUserMessage.role === 'user') {
    parentMessage = await saveMessage({
      id: lastUserMessage.id,
      role: lastUserMessage.role,
      content: lastUserMessage.content,
      conversationId,
      userIp,
      userAgent,
    });
  }

  // Track start time for processing
  const startTime = Date.now();
  let isCompleted = false;

  const result = streamText({
    model: openai('gpt-4o-mini-2024-07-18'),
    system: `You are a helpful assistant specialized in answering questions about the course content.
    Always check your course slide knowledge base before answering. 
    Only respond with information from tool calls; if no relevant information is found, respond with "Sorry, I don't know."
    If you use a specific course slide content, mention it by stating 【source_NUMBER】 at the very end of your response (e.g. 【source_1】) You can only cite a single source once, so if you cite a source, don't cite it again in the same response.`,
    messages,
    tools: {
      getInformation: tool({
        description: `Retrieve course slide content from the knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe('the user\'s question'),
        }),
        execute: async ({ question }) => {
          return findRelevantContent(question);
        },
      })
    },
    experimental_transform: smoothStream(),
    onFinish: async (completion: any) => {
      // Ensure we only save the message once at the very end
      if (isCompleted) return;
      isCompleted = true;

      try {
        await saveMessage({
          id: completion.response.messages?.[0]?.id,
          role: 'assistant',
          content: completion.text,
          conversationId,
          parentMessageId: parentMessage?.id,
          toolInvocations: completion.toolCalls,
          userIp,
          userAgent,
          processingTime: Date.now() - startTime,
          tokenCount: completion.usage?.completionTokens,
        });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    }
  });

  // Return streaming response with conversation ID
  return result.toDataStreamResponse({ 
    headers: { 
      'x-conversation-id': conversationId,
      'Set-Cookie': `conversationId=${conversationId}; Path=/; SameSite=Strict`
    }
  });
}
