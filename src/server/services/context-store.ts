import { qdrantService } from './qdrant';
import { generateEmbedding } from './embeddings';
import { randomUUID } from 'crypto';

export interface AgentContext {
  id: string;
  agentType: string;
  task: string;
  result: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export class ContextStore {
  async store(context: Omit<AgentContext, 'id' | 'timestamp'>): Promise<string> {
    const id = randomUUID();
    const text = `${context.agentType}: ${context.task}\n${context.result}`;
    const vector = generateEmbedding(text);

    await qdrantService.storeContext({
      id,
      vector,
      payload: {
        ...context,
        id,
        timestamp: new Date().toISOString(),
      },
    });

    return id;
  }

  async findRelated(query: string, limit = 5): Promise<AgentContext[]> {
    const vector = generateEmbedding(query);
    const results = await qdrantService.searchSimilar({ vector, limit });
    return results.map((r) => r.payload as unknown as AgentContext);
  }

  async getByAgentType(agentType: string, limit = 10): Promise<AgentContext[]> {
    const vector = generateEmbedding(agentType);
    const results = await qdrantService.searchSimilar({
      vector,
      limit,
      filter: {
        must: [{ key: 'agentType', match: { value: agentType } }],
      },
    });
    return results.map((r) => r.payload as unknown as AgentContext);
  }
}

export const contextStore = new ContextStore();
