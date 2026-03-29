import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'agent_context';

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async ensureCollection(): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);
    if (!exists) {
      await this.client.createCollection(COLLECTION_NAME, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
    }
  }

  async storeContext(params: {
    id: string;
    vector: number[];
    payload: Record<string, unknown>;
  }): Promise<void> {
    await this.ensureCollection();
    await this.client.upsert(COLLECTION_NAME, {
      points: [
        {
          id: params.id,
          vector: params.vector,
          payload: params.payload,
        },
      ],
    });
  }

  async searchSimilar(params: {
    vector: number[];
    limit?: number;
    filter?: Record<string, unknown>;
  }): Promise<Array<{ id: string; score: number; payload: Record<string, unknown> }>> {
    await this.ensureCollection();
    const results = await this.client.search(COLLECTION_NAME, {
      vector: params.vector,
      limit: params.limit || 5,
      filter: params.filter,
      with_payload: true,
    });
    return results.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: (r.payload || {}) as Record<string, unknown>,
    }));
  }

  async deleteContext(id: string): Promise<void> {
    await this.client.delete(COLLECTION_NAME, {
      points: [id],
    });
  }
}

export const qdrantService = new QdrantService();
