import { BaseAgent, AgentResult } from './base-agent';
import { LinearMCPService } from '../services/linear-mcp';

const linearMCP = new LinearMCPService();

export class TaskMgmtAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Task Management Agent',
      type: 'task-mgmt',
      systemPrompt: `あなたはTask Management Agentです。開発タスクの分解、見積もり、優先順位付けを行う専門家です。
以下のルールに従ってください：

## タスク生成ルール
1. **分解**: 大きなタスクを1-3日で完了可能な粒度に分解
2. **優先順位**: P0(緊急) > P1(高) > P2(中) > P3(低)
3. **見積もり**: ストーリーポイント (1,2,3,5,8,13)
4. **ラベル**: frontend, backend, design, testing, infra, docs
5. **依存関係**: タスク間の依存を明示

## 出力フォーマット
各タスクを以下の形式で出力：
- タイトル
- 説明
- 優先度
- 見積もり
- ラベル
- 依存タスク`,
      maxTokens: 4096,
    });
  }

  protected async run(task: string): Promise<Omit<AgentResult, 'agentType' | 'duration'>> {
    // 既存のLinearイシューを取得してコンテキストに含める
    let existingIssues: string = '';
    try {
      const issues = await linearMCP.listIssues({ limit: 10 });
      existingIssues = issues.map((i) => `- [${i.state}] ${i.title}`).join('\n');
    } catch {
      existingIssues = '(Linear未接続 - モック使用中)';
    }

    const { text, tokenUsage } = await this.callClaude(
      `以下のプロジェクト要件からタスクを生成してください。

要件: ${task}

現在のLinearイシュー:
${existingIssues}

上記の既存タスクと重複しないようにタスクを生成してください。`,
    );

    return {
      success: true,
      result: text,
      tokenUsage,
      artifacts: {
        linearConnected: existingIssues !== '(Linear未接続 - モック使用中)',
      },
    };
  }
}
