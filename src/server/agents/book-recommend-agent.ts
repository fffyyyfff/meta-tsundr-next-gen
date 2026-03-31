import { BaseAgent } from './base-agent';
import type { AgentResult } from './base-agent';

export class BookRecommendAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Book Recommend Agent',
      type: 'book-recommend',
      systemPrompt: `あなたは読書アドバイザーです。ユーザーの読書履歴を分析し、次に読むべき本を3〜5冊推薦してください。

以下のルールに従ってください：
- 推薦は日本語で出力
- 各推薦について、書名・著者・推薦理由を記載
- ユーザーの読書傾向（ジャンル、著者の傾向）を考慮
- 既読の本は推薦しない
- Markdown形式で出力`,
      maxTokens: 2048,
    });
  }

  protected async run(task: string): Promise<Omit<AgentResult, 'agentType' | 'duration'>> {
    const { text, tokenUsage } = await this.callClaude(task);
    return { success: true, result: text, tokenUsage };
  }
}

export const bookRecommendAgent = new BookRecommendAgent();
