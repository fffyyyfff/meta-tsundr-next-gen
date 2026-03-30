import Anthropic from '@anthropic-ai/sdk';
import { withRetry } from '../services/retry';

export interface AgentResult {
  success: boolean;
  result?: string;
  error?: string;
  agentType: string;
  duration: number;
  tokenUsage?: number;
  artifacts?: Record<string, unknown>;
}

export interface AgentConfig {
  name: string;
  type: string;
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
}

export abstract class BaseAgent {
  protected anthropic: Anthropic;
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-test',
    });
  }

  async execute(task: string): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const result = await this.run(task);
      return {
        ...result,
        agentType: this.config.type,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentType: this.config.type,
        duration: Date.now() - startTime,
      };
    }
  }

  protected abstract run(task: string): Promise<Omit<AgentResult, 'agentType' | 'duration'>>;

  protected async callClaude(userMessage: string): Promise<{ text: string; tokenUsage: number }> {
    const message = await withRetry(
      () =>
        this.anthropic.messages.create({
          model: this.config.model || 'claude-sonnet-4-5-20250514',
          max_tokens: this.config.maxTokens || 2048,
          system: this.config.systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        retryableErrors: [429, 500, 503],
      },
    );

    const content = message.content[0];
    const text = content.type === 'text' ? content.text : '';
    const tokenUsage = message.usage.input_tokens + message.usage.output_tokens;

    return { text, tokenUsage };
  }
}
