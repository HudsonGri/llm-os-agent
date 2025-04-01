// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
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
        model: openai('gpt-4o'),
        // model: google('gemini-2.0-flash-lite-preview-02-05'),
        system: `
You are a specialized assistant for answering questions about COP4600, Operating Systems.

Check your knowledge base before responding. Prioritize "topic-specific" sources over "general" ones for accurate and relevant information. 

Respond only with information from tool calls. If no relevant information is available, reply with "I couldn't find any relevant course-specific information on that topic. Could you please clarify or ask another question?"

Answer only questions specifically related to the Operating Systems course. If a question is off-topic, inform the user that you can only assist with Operating Systems content.

When using a specific source, include a source tag at the end of your response, e.g., 【source_NUMBER】. Cite each source only once per response. Do not include any source tags if no tool call is used.

If asked to generate code for exercises or projects, decline and encourage the user to attempt it themselves first. Offer troubleshooting assistance thereafter.`,
        messages,
        tools: {
          getInformation: tool({
            description: `Retrieve course content from the knowledge base to answer questions. If the user's question is about a specific topic such as asking about a specific project or exercise, use the questionTopic parameter to specify the topic. Only use this tool once per question.`,
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
            // Debug log to see tool call structure
            console.log('Raw tool calls from AI:', JSON.stringify(completion.toolCalls, null, 2));
            
            // Process the tool calls to ensure we have all required fields
            const processedToolCalls = completion.toolCalls ? completion.toolCalls.map((toolCall: any, index: number) => {
              const processed = {
                toolName: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                state: toolCall.state || 'result',
                step: index,
                args: toolCall.args || {},
                result: toolCall.result
              };
              
              console.log(`Processed tool call ${index}:`, JSON.stringify(processed, null, 2));
              return processed;
            }) : [];

            await saveMessage({
              id: completion.response.messages?.[0]?.id,
              role: 'assistant',
              content: completion.text,
              conversationId,
              parentMessageId: parentMessage?.id,
              toolInvocations: processedToolCalls,
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
