import { BaseAgent, AgentResult } from './base-agent';
import { PlaywrightMCPService } from '../services/playwright-mcp';

const playwrightMCP = new PlaywrightMCPService();

export class TestGenAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Test Generation Agent',
      type: 'test-gen',
      systemPrompt: `あなたはTest Generation Agentです。Playwright E2Eテストとユニットテストを自動生成する専門家です。
以下のルールに従ってください：

## テスト生成ルール
1. **E2Eテスト**: Playwright Test (TypeScript)
2. **ユニットテスト**: Vitest
3. **テスト構造**: Arrange-Act-Assert パターン
4. **カバレッジ**: 正常系、異常系、境界値
5. **セレクタ**: data-testid優先、role/labelで補完
6. **アサーション**: 具体的で信頼性の高いアサーション

## 出力フォーマット
\`\`\`typescript
import { test, expect } from '@playwright/test';
// テストコード
\`\`\``,
      maxTokens: 4096,
    });
  }

  protected async run(task: string): Promise<Omit<AgentResult, 'agentType' | 'duration'>> {
    // Playwright MCPで基本テスト生成
    const baseTest = playwrightMCP.generateTestFromDescription(task);

    // Claudeで高品質なテストに改善
    const { text, tokenUsage } = await this.callClaude(
      `以下のテスト要件に基づき、高品質なPlaywright E2Eテストを生成してください。

要件: ${task}

Playwright MCPが生成した基本テスト:
\`\`\`typescript
${baseTest.code}
\`\`\`

以下を改善してください：
1. より具体的なセレクタとアサーション
2. 正常系と異常系の両方
3. テストデータのセットアップ
4. 適切なwaitとタイムアウト設定`,
    );

    return {
      success: true,
      result: text,
      tokenUsage,
      artifacts: {
        baseTestScenario: baseTest.scenario,
        generatedTests: 1,
      },
    };
  }
}
