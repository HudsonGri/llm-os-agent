import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '../db';
import { cosineDistance, desc, gt, sql, and, like, or } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';
import { resources } from '../db/schema/resources';
import { eq } from 'drizzle-orm';

const embeddingModel = openai.embedding('text-embedding-ada-002');

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

// Define the result type for clarity
type ContentResult = {
  name: string;
  similarity: number;
  filename: string | null;
  url: string | null;
  filepath: string | null;
  source: 'topic-specific' | 'general';
};

export const findRelevantContent = async (
  userQuery: string, 
  topic: 'exercise' | 'project' | 'lecture slides' | 'other' = 'other',
  topicNumber?: number
) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;
  
  // Build the query for similarity search
  const baseQuery = db
    .select({
      name: embeddings.content,
      similarity,
      filename: resources.filename,
      url: resources.url,
      filepath: resources.filepath,
    })
    .from(embeddings)
    .leftJoin(resources, eq(embeddings.resourceId, resources.id))
    .where(gt(similarity, 0.5));
  
  // First, try to get topic-specific results if applicable
  let topicSpecificResults: ContentResult[] = [];
  if (topic !== 'other' && topicNumber) {
    let topicPattern = '';
    let alternativePattern = '';
    
    if (topic === 'exercise') {
      topicPattern = `Exercise ${topicNumber}`;
      alternativePattern = `Ex${topicNumber}`;
    } else if (topic === 'project') {
      topicPattern = `Project ${topicNumber}`;
    } else if (topic === 'lecture slides') {
      topicPattern = `Lecture`;
    }
    
    if (topicPattern) {
      const whereCondition = topic === 'exercise' 
        ? or(
            like(resources.filepath, `%${topicPattern}%`),
            like(resources.filepath, `%${alternativePattern}%`)
          )
        : like(resources.filepath, `%${topicPattern}%`);
      
      const results = await db
        .select({
          name: embeddings.content,
          similarity,
          filename: resources.filename,
          url: resources.url,
          filepath: resources.filepath,
        })
        .from(embeddings)
        .leftJoin(resources, eq(embeddings.resourceId, resources.id))
        .where(and(
          gt(similarity, 0.5),
          whereCondition
        ))
        .orderBy(desc(similarity))
        .limit(5);
      
      // Mark results as topic-specific
      topicSpecificResults = results.map(result => ({
        ...result,
        source: 'topic-specific' as const
      }));
    }
  }

  // Get general results
  const generalResultsRaw = await baseQuery
    .orderBy(desc(similarity))
    .limit(5);
  
  // Mark results as general
  const generalResults = generalResultsRaw.map(result => ({
    ...result,
    source: 'general' as const
  }));
  
  console.log('generalResults:', generalResults);
  // Combine results, prioritizing topic-specific ones
  const combinedResults: ContentResult[] = [...topicSpecificResults];
  
  // Add general results that aren't already included
  for (const result of generalResults) {
    const isDuplicate = combinedResults.some(
      r => r.name === result.name && r.filename === result.filename
    );
    
    if (!isDuplicate) {
      combinedResults.push(result);
    }
  }
  
  return combinedResults;
};