// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';

export const maxDuration = 30;

// Add this type for topics
const TopicEnum = z.enum([
  'General',
  'Process Management',
  'Memory Management',
  'File Systems',
  'I/O Systems',
  'Virtualization',
  'Scheduling',
  'Concurrency',
  'Synchronization',
  'Deadlocks',
  'Security',
  'Networking',
  'Device Drivers',
  'System Calls',
  'Boot Process',
  'Shell & Commands',
  'Performance',
  'Distributed Systems',
  'Real-time Systems',
  'Error Handling'
]);

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini-2024-07-18'),
    system: `You are a helpful assistant specialized in answering questions about the course content.
    Always check your course slide knowledge base before answering. 
    Only respond with information from tool calls; if no relevant information is found, respond with "Sorry, I don't know."
    If you use a specific course slide content, mention it by stating 【source_NUMBER】 after you used it (e.g. 【source_1】).
    For each response, you must first call the tagResponse tool to categorize your response with a relevant topic.`,
    messages,
    tools: {
      getInformation: tool({
        description: `Retrieve course slide content from the knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe('the user’s question'),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
      tagResponse: tool({
        description: 'Tag the response with a relevant topic. Must be called before responding.',
        parameters: z.object({
          topic: TopicEnum.describe('The topic that best matches the response content'),
        }),
        execute: async ({ topic }) => ({ topic }),
      }),
    },
  });

  return result.toDataStreamResponse();
}
