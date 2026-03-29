import crypto from 'crypto';

// Simple deterministic embedding for development
// Replace with real embedding model (e.g., Voyage AI, OpenAI) in production
export function generateEmbedding(text: string): number[] {
  const hash = crypto.createHash('sha512').update(text).digest();
  const vector: number[] = [];
  for (let i = 0; i < 1536; i++) {
    vector.push((hash[i % hash.length] / 255) * 2 - 1);
  }
  return vector;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

export class HashEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    return generateEmbedding(text);
  }
}
