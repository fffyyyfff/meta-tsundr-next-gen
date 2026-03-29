// FigmaMCPのモック実装（実際のFigma APIを使用しないデモ版）

export interface FigmaDesign {
  name: string;
  components: FigmaComponent[];
  tokens: DesignTokens;
}

export interface FigmaComponent {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
}

export interface ColorToken {
  name: string;
  value: string;
  category: string;
}

export interface TypographyToken {
  name: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
}

export interface SpacingToken {
  name: string;
  value: string;
}

export class FigmaMCPService {
  /**
   * Figmaデザインを取得（モック）
   */
  async fetchDesign(figmaUrl: string): Promise<FigmaDesign> {
    // 実際のFigma APIコールの代わりに、モックデータを返す
    await this.simulateDelay();

    return {
      name: 'Sample Design System',
      components: [
        {
          id: 'comp-1',
          name: 'Button',
          type: 'COMPONENT',
          properties: {
            variant: 'primary',
            size: 'medium',
          },
        },
        {
          id: 'comp-2',
          name: 'Card',
          type: 'COMPONENT',
          properties: {
            elevated: true,
          },
        },
        {
          id: 'comp-3',
          name: 'Input',
          type: 'COMPONENT',
          properties: {
            type: 'text',
          },
        },
      ],
      tokens: {
        colors: [
          { name: 'primary', value: '#3b82f6', category: 'brand' },
          { name: 'secondary', value: '#8b5cf6', category: 'brand' },
          { name: 'success', value: '#10b981', category: 'semantic' },
          { name: 'error', value: '#ef4444', category: 'semantic' },
        ],
        typography: [
          {
            name: 'heading-1',
            fontSize: '2.25rem',
            fontWeight: '700',
            lineHeight: '2.5rem',
          },
          {
            name: 'body',
            fontSize: '1rem',
            fontWeight: '400',
            lineHeight: '1.5rem',
          },
        ],
        spacing: [
          { name: 'xs', value: '0.25rem' },
          { name: 'sm', value: '0.5rem' },
          { name: 'md', value: '1rem' },
          { name: 'lg', value: '1.5rem' },
          { name: 'xl', value: '2rem' },
        ],
      },
    };
  }

  /**
   * Figmaコンポーネントから React コードを生成（モック）
   */
  async generateReactCode(component: FigmaComponent): Promise<string> {
    await this.simulateDelay();

    const componentName = component.name;
    const code = `
import React from 'react';

interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

export function ${componentName}({ children, className }: ${componentName}Props) {
  return (
    <div className={\`${componentName.toLowerCase()} \${className || ''}\`}>
      {children}
    </div>
  );
}
    `.trim();

    return code;
  }

  /**
   * デザイントークンを Tailwind CSS設定に変換（モック）
   */
  async generateTailwindConfig(tokens: DesignTokens): Promise<string> {
    await this.simulateDelay();

    const colors = tokens.colors.reduce((acc, token) => {
      acc[token.name] = token.value;
      return acc;
    }, {} as Record<string, string>);

    const spacing = tokens.spacing.reduce((acc, token) => {
      acc[token.name] = token.value;
      return acc;
    }, {} as Record<string, string>);

    const config = {
      theme: {
        extend: {
          colors,
          spacing,
        },
      },
    };

    return `// Generated Tailwind Config\nmodule.exports = ${JSON.stringify(
      config,
      null,
      2
    )}`;
  }

  private async simulateDelay(ms: number = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
