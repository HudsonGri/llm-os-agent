import { openai } from '@ai-sdk/openai';
import { tool, generateText } from 'ai';
import { z } from 'zod';
import { TOPICS } from '@/lib/topics';

/**
 * Tags a message content with a topic using GPT-4o-mini
 * This is designed to run asynchronously to not block the main request
 */
export async function tagMessageContent(content: string): Promise<{ topic: string }> {


  try {
    // Use a lightweight model to classify the message
    const result = await generateText({
      model: openai('gpt-4.1-nano'),
      system: `You are a message classifier that assigns the most appropriate topic tag to messages.
      Choose the single most appropriate topic from this list: ${TOPICS.join(', ')}.
      If none match well, use "General Question". Response should be just the topic name, nothing else.`,
      prompt: `Message to classify: "${content}"`,
      temperature: 0.1, // Low temperature for consistent results
      maxTokens: 15,    // We only need a short response
    });

    // Extract the topic from the response (the result is the text itself)
    const topic = result.text.trim();
    
    // Validate that it's one of our example topics
    return { 
      topic: TOPICS.includes(topic) ? topic : 'General Question' 
    };
  } catch (error) {
    console.error('Error tagging message content:', error);
    return { topic: 'General Question' }; // Default fallback
  }
}

/**
 * Tool for tagging message content
 * This can be used in tool calling flows
 */
export const tagResponseTool = tool({
  description: 'Tag a message with a topic category',
  parameters: z.object({
    content: z.string().describe('The message content to tag with a topic'),
  }),
  execute: async ({ content }) => {
    return await tagMessageContent(content);
  },
}); 