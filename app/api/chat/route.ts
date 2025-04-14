// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { streamText, tool, smoothStream } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';


import { saveMessage, createConversation } from '@/lib/actions/chats';
import { headers } from 'next/headers';
import { wasReasoningEnabled } from '@/lib/actions/chats';

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
    
    const { messages, conversationId: existingConversationId, reasoning: requestReasoning } = requestData;
    
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
    
    // Determine if reasoning should be enabled
    let reasoning = Boolean(requestReasoning);
    
    // For existing conversations, check if reasoning was previously enabled
    if (existingConversationId && !reasoning) {
      try {
        reasoning = await wasReasoningEnabled(existingConversationId);
        console.log(`Existing conversation found. Previous reasoning status: ${reasoning}`);
      } catch (error) {
        console.error('Error checking previous reasoning status:', error);
      }
    }
    
    // Log reasoning flag for debugging
    console.log(`Processing chat request with reasoning=${reasoning} (from request: ${Boolean(requestReasoning)})`);
    
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
          messages: messages,
          reasoning: reasoning === true ? true : false
        });
        
        console.log(`User message saved with reasoning=${reasoning}`);
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
      // Define the base system prompt
      const baseSystemPrompt = `
You are a specialized assistant for answering questions about COP4600, Operating Systems. You always provide detailed responses that are well-structured and easy to understand.

Check your knowledge base before responding. Prioritize "topic-specific" sources over "general" ones for accurate and relevant information. Use as much of the relevant knowledge base as possible to answer the question, your answers should be comprehensive and thorough.

Respond only with information from tool calls. If no relevant information is available, reply with "I couldn't find any relevant course-specific information on that topic. Could you please clarify or ask another question?"

Answer only questions specifically related to the Operating Systems course. If a question is clearly off-topic, inform the user that you can only assist with Operating Systems content.

Format your responses using markdown for better readability. Use headings, lists, code blocks, and other markdown features as appropriate.

Citation Rules:
When using sources, include a numbered tag at the end of your response, e.g., \`【source_1】\`.  
You must not cite the same source more than once per response. If multiple facts come from the same source, cite it only once. This is critical — duplicate source tags with the same number (e.g., \`【source_1】【source_1】\`) will be hevaily penalized. You can use multiple source tags if you use multiple sources, e.g. 【source_1】【source_2】. Do not include any source tags if no tool call is used.   Example of correct citation: "The answer is 42. 【source_1】【source_2】"

If asked to generate code for exercises or projects, decline and encourage the user to attempt it themselves first. Offer troubleshooting assistance thereafter.`;
      
      console.log(`Starting AI request with model: ${reasoning ? 'o3-mini' : '4o-mini'}${reasoning ? ' (with reasoning)' : ''}`);
      
      // Setup stream handler to catch early errors
      let hasStreamStarted = false;
      let streamError = null;

      try {
        const result = streamText({
          model: openai(reasoning ? 'o3-mini' : 'gpt-4.1-mini'),
          providerOptions: {
            openai: reasoning ? { reasoningEffort: 'low' } : {},
          },
          system: baseSystemPrompt,
          messages,
          tools: {
            getInformation: tool({
              description: `Retrieve course content from the knowledge base to answer questions. If the user's question is about a specific topic such as asking about a specific project or exercise, use the questionTopic parameter to specify the topic. Only use this tool once per question.`,
              parameters: z.object({
                question: z.string().describe('the user\'s question'),
                topic: z.enum(['exercise', 'project', 'module', 'other']).describe('the topic of the user\'s question'),
                topicNumber: z.number().describe('optional number for specific exercises, projects, or modules, if other then this should be 0'),
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
          onError: (error) => {
            console.error('Stream error detected:', error);
            streamError = error;
          },
          onFinish: async (completion: any) => {
            // Ensure we only save the message once at the very end
            if (isCompleted) return;
            isCompleted = true;

            try {
              // Debug log to see tool call structure
              console.log('AI response completed successfully');
              console.log(`Saving assistant message with reasoning=${reasoning}`);
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
                id: completion.response?.messages?.[0]?.id,
                role: 'assistant',
                content: completion.text,
                conversationId,
                parentMessageId: parentMessage?.id,
                toolInvocations: processedToolCalls,
                userIp,
                userAgent,
                processingTime: Date.now() - startTime,
                tokenCount: completion.usage?.completionTokens,
                messages: messages,
                reasoning: reasoning === true ? true : false
              });
              console.log(`Assistant message saved with reasoning=${reasoning}`);
            } catch (error) {
              console.error('Error saving assistant message:', error);
              // We continue even if saving fails - the response has already been generated
            }
          }
        });

        // Check if there was an error detected by the onError handler
        if (streamError) {
          throw streamError;
        }

        // Return streaming response with conversation ID
        console.log('Returning stream response');
        return result.toDataStreamResponse({ 
          sendReasoning: false,
          headers: { 
            'x-conversation-id': conversationId,
            'Set-Cookie': `conversationId=${conversationId}; Path=/; SameSite=Strict`
          }
        });
      } catch (streamError) {
        console.error('Error during stream creation:', streamError);
        console.error('Error details:', JSON.stringify(streamError, Object.getOwnPropertyNames(streamError), 2));
        throw streamError; // Propagate to outer catch block
      }
    } catch (error: any) {
      console.error('Error in AI stream generation:', error);
      console.error('Error type:', typeof error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Attempt to extract more details about the error
      let errorDetails = 'Unknown error';
      if (error.response) {
        console.error('Error response:', error.response);
        try {
          errorDetails = JSON.stringify(error.response);
        } catch (e) {
          errorDetails = 'Error response could not be serialized';
        }
      } else if (error.data) {
        console.error('Error data:', error.data);
        try {
          errorDetails = JSON.stringify(error.data);
        } catch (e) {
          errorDetails = 'Error data could not be serialized';
        }
      }
      
      // Check for rate limiting or quota errors from OpenAI
      if (error.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded or quota reached with AI provider. Please try again later.',
            details: errorDetails
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Check for model availability issues
      if (error.status === 503 || error.message?.includes('overloaded')) {
        return new Response(
          JSON.stringify({ 
            error: 'AI service is currently overloaded. Please try again later.',
            details: errorDetails
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Specific check for o3-mini model issues
      if (error.message?.includes('o3-mini') || error.message?.includes('model')) {
        return new Response(
          JSON.stringify({ 
            error: 'There was an issue with the AI model. This may be due to compatibility issues with o3-mini.',
            details: errorDetails
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Generic AI service error
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate AI response. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    // Catch-all for any unhandled errors
    console.error('Unhandled error in chat API route:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
