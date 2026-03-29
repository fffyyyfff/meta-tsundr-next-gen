import { BaseAgent, AgentResult } from './base-agent';
import { FigmaMCPService } from '../services/figma-mcp';

const figmaMCP = new FigmaMCPService();

export class DesignAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Design Agent',
      type: 'design',
      systemPrompt: `あなたはDesign Agentです。Figmaデザインからフロントエンドコンポーネントを生成する専門家です。
以下のルールに従ってください：
- React + TypeScript + Tailwind CSSでコンポーネントを生成
- shadcn/uiのパターンに準拠
- アクセシビリティ（WCAG 2.1 AA）を考慮
- レスポンシブデザインを実装
- コンポーネントのpropsはTypeScript interfaceで定義`,
      maxTokens: 4096,
    });
  }

  protected async run(task: string): Promise<Omit<AgentResult, 'agentType' | 'duration'>> {
    const figmaUrlMatch = task.match(/https:\/\/(?:www\.)?figma\.com\/\S+/);

    if (figmaUrlMatch) {
      return this.runWithFigma(task, figmaUrlMatch[0]);
    }

    // Figma URLなしの場合はClaudeで生成
    const { text, tokenUsage } = await this.callClaude(
      `以下のデザイン要件からReact + Tailwind CSSコンポーネントを生成してください:\n\n${task}`,
    );

    return { success: true, result: text, tokenUsage };
  }

  private async runWithFigma(
    task: string,
    figmaUrl: string,
  ): Promise<Omit<AgentResult, 'agentType' | 'duration'>> {
    const design = await figmaMCP.fetchDesign(figmaUrl);

    const generatedComponents = await Promise.all(
      design.components.map((c) => figmaMCP.generateReactCode(c)),
    );

    const tailwindConfig = figmaMCP.generateTailwindConfig(design.designTokens);

    // Claudeで洗練
    const { text, tokenUsage } = await this.callClaude(
      `以下のFigmaデザインから生成された初期コンポーネントを改善してください。

デザイン名: ${design.name}
デザイントークン: ${JSON.stringify(design.designTokens, null, 2)}

初期生成コンポーネント:
${generatedComponents.join('\n---\n')}

ユーザー要件: ${task}

改善されたコンポーネントコードを出力してください。`,
    );

    return {
      success: true,
      result: text,
      tokenUsage,
      artifacts: {
        designName: design.name,
        componentCount: design.components.length,
        tailwindConfig,
        designTokens: design.designTokens,
      },
    };
  }
}
