'use server';

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from '@/lib/db/schema/resources';
import { db } from '../db';
import { generateEmbedding } from '../ai/embedding';
import { embeddings as embeddingsTable } from '../db/schema/embeddings';

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content, filename, url } = insertResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({ content, filename, url })
      .returning();

    const embedding = await generateEmbedding(content);
    await db.insert(embeddingsTable).values({
      resourceId: resource.id,
      content: content,
      embedding: embedding,
    });

    return 'Resource successfully created and embedded.';
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.';
  }
};