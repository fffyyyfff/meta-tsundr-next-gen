import { BaseAgent } from './base-agent';
import type { AgentResult } from './base-agent';

export class BookReviewAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Book Review Agent',
      type: 'book-review',
      systemPrompt: `あなたは書評家です。指定された書籍について、読者の感想やメモも参考にしながら書評を生成してください。

以下のルールに従ってください：
- 日本語で出力
- 書籍の概要、主要なテーマ、読みどころを含める
- ユーザーのメモがある場合は、その視点も取り入れる
- 客観的かつ読みやすい文章で書く
- Markdown形式で出力`,
      maxTokens: 2048,
    });
  }

  protected async run(task: string): Promise<Omit<AgentResult, 'agentType' | 'duration'>> {
    const { text, tokenUsage } = await this.callClaude(task);
    return { success: true, result: text, tokenUsage };
  }
}

export const bookReviewAgent = new BookReviewAgent();
