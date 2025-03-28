// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText, tool, smoothStream } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';


import { saveMessage, createConversation } from '@/lib/actions/chats';
import { headers } from 'next/headers';

// TODO: Test if this is needed/useful
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const headersList = headers();
    
    // Parse request body with error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Failed to parse request JSON:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { messages, conversationId: existingConversationId } = requestData;
    
    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required and cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get or create conversation ID with error handling
    let conversationId: string;
    try {
      conversationId = existingConversationId || await createConversation();
      if (!conversationId) {
        throw new Error('Failed to create or retrieve conversation ID');
      }
    } catch (error) {
      console.error('Conversation creation error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create or retrieve conversation' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user information
    const userIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
    const userAgent = headersList.get('user-agent') || '';

    // Save the user message first if last message is from user
    const lastUserMessage = messages[messages.length - 1];
    let parentMessage: { id: string } | undefined;
    
    if (lastUserMessage.role === 'user') {
      try {
        parentMessage = await saveMessage({
          id: lastUserMessage.id,
          role: lastUserMessage.role,
          content: lastUserMessage.content,
          conversationId,
          userIp,
          userAgent,
          messages: messages
        });
      } catch (error) {
        console.error('Error saving user message:', error);
        // We'll continue even if saving user message fails
        // This allows partial functionality rather than complete failure
      }
    }

    // Track start time for processing
    const startTime = Date.now();
    let isCompleted = false;

    try {
      const result = streamText({
        model: openai('gpt-4o-mini-2024-07-18'),
        system: `You are a helpful assistant specialized in answering questions about the course content.
        Always check your course slide knowledge base before answering. When answering a question, you should prioritize results where the source is "topic-specific" over results where the source is "general".
        Only respond with information from tool calls; if no relevant information is found, respond with "Sorry, I don't know."
        If you use a specific course slide content, mention it by stating a source tag 【source_NUMBER】 at the very end of your response (e.g. 【source_1】) You can only cite a single source once, so if you cite a source, don't cite it again in the same response. If you are not provided any sources from the tool call, don't mention any source tags.`,
        messages,
        tools: {
          getInformation: tool({
            description: `Retrieve course slide content from the knowledge base to answer questions. If the user's question is about a specific topic such as asking about a specific project or exercise, use the questionTopic parameter to specify the topic.`,
            parameters: z.object({
              question: z.string().describe('the user\'s question'),
              topic: z.enum(['exercise', 'project', 'lecture slides', 'other']).describe('the topic of the user\'s question'),
              topicNumber: z.number().optional().describe('optional number for specific exercises or projects'),
            }),
            execute: async ({ question, topic, topicNumber }) => {
              try {
                return await findRelevantContent(question, topic, topicNumber);
              } catch (error) {
                console.error('Error finding relevant content:', error);
                // Return empty results rather than failing completely
                return { sources: [], results: [] };
              }
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
              messages: messages
            });
          } catch (error) {
            console.error('Error saving assistant message:', error);
            // We continue even if saving fails - the response has already been generated
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
    } catch (error: any) {
      console.error('Error in AI stream generation:', error);
      
      // Check for rate limiting or quota errors from OpenAI
      if (error.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded or quota reached with AI provider. Please try again later.' 
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Check for model availability issues
      if (error.status === 503 || error.message?.includes('overloaded')) {
        return new Response(
          JSON.stringify({ 
            error: 'AI service is currently overloaded. Please try again later.' 
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Generic AI service error
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate AI response. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    // Catch-all for any unhandled errors
    console.error('Unhandled error in chat API route:', error);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
