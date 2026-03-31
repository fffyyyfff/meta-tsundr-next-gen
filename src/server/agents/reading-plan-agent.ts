import { BaseAgent } from './base-agent';
import type { AgentResult } from './base-agent';

export class ReadingPlanAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Reading Plan Agent',
      type: 'reading-plan',
      systemPrompt: `あなたは読書プランナーです。ユーザーの積読リスト（未読本のリスト）を受け取り、週間読書スケジュールを作成してください。

以下のルールに従ってください：
- 日本語で出力
- 1週間（月〜日）のスケジュールを作成
- 各日に読む本と推奨読書時間を提案
- 本の難易度や長さを考慮して無理のないスケジュールにする
- 優先順位の理由も簡潔に説明
- Markdown形式のテーブルで出力`,
      maxTokens: 2048,
    });
  }

  protected async run(task: string): Promise<Omit<AgentResult, 'agentType' | 'duration'>> {
    const { text, tokenUsage } = await this.callClaude(task);
    return { success: true, result: text, tokenUsage };
  }
}

export const readingPlanAgent = new ReadingPlanAgent();
