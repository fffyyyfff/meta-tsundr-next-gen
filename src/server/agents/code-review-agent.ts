import { BaseAgent, AgentResult } from './base-agent';

export class CodeReviewAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Code Review Agent',
      type: 'code-review',
      systemPrompt: `あなたはCode Review Agentです。コードの品質、セキュリティ、パフォーマンスをレビューする専門家です。
以下の観点でレビューしてください：

## レビュー観点
1. **セキュリティ**: XSS, SQLインジェクション, CSRF, 認証/認可の問題
2. **パフォーマンス**: N+1クエリ, 不必要な再レンダリング, メモリリーク
3. **コード品質**: SOLID原則, DRY, 可読性, テスタビリティ
4. **TypeScript**: 型安全性, any使用, 適切なジェネリクス
5. **React**: Hooks使用ルール, メモ化, エラーバウンダリ
6. **アクセシビリティ**: ARIA属性, キーボードナビゲーション

## 出力フォーマット
各指摘を以下の形式で出力：
- 🔴 Critical: 即修正必要
- 🟡 Warning: 改善推奨
- 🟢 Info: 提案・ベストプラクティス`,
      maxTokens: 4096,
    });
  }

  protected async run(task: string): Promise<Omit<AgentResult, 'agentType' | 'duration'>> {
    const { text, tokenUsage } = await this.callClaude(
      `以下のコードをレビューしてください:\n\n${task}`,
    );

    const criticalCount = (text.match(/🔴/g) || []).length;
    const warningCount = (text.match(/🟡/g) || []).length;
    const infoCount = (text.match(/🟢/g) || []).length;

    return {
      success: true,
      result: text,
      tokenUsage,
      artifacts: {
        summary: {
          critical: criticalCount,
          warning: warningCount,
          info: infoCount,
          total: criticalCount + warningCount + infoCount,
        },
      },
    };
  }
}
