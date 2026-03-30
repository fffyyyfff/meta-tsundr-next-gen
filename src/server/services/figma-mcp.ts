// Figma MCP Service - Real Figma REST API integration with mock fallback
import { withRetry, RetryableError } from './retry';

export interface FigmaDesign {
  name: string;
  components: FigmaComponent[];
  designTokens: DesignTokens;
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

interface FigmaAPIFile {
  name: string;
  document: FigmaAPINode;
  styles: Record<string, FigmaAPIStyle>;
}

interface FigmaAPINode {
  id: string;
  name: string;
  type: string;
  children?: FigmaAPINode[];
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  style?: {
    fontSize?: number;
    fontWeight?: number;
    lineHeightPx?: number;
  };
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
}

interface FigmaAPIStyle {
  key: string;
  name: string;
  styleType: string;
}

export class FigmaMCPService {
  private accessToken: string | null;
  private baseUrl = 'https://api.figma.com/v1';

  constructor() {
    this.accessToken = process.env.FIGMA_ACCESS_TOKEN || null;
  }

  private get isRealAPI(): boolean {
    return this.accessToken !== null && this.accessToken !== 'your_figma_token_here';
  }

  async fetchDesign(figmaUrl: string): Promise<FigmaDesign> {
    if (!this.isRealAPI) {
      return this.fetchDesignMock(figmaUrl);
    }

    const fileKey = this.extractFileKey(figmaUrl);
    if (!fileKey) throw new Error('Invalid Figma URL');

    return withRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
          headers: { 'X-Figma-Token': this.accessToken! },
        });

        if (!response.ok) {
          throw new RetryableError(
            `Figma API error: ${response.status} ${response.statusText}`,
            response.status,
          );
        }

        const data = (await response.json()) as FigmaAPIFile;
        return this.parseFileToDesign(data);
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        retryableErrors: [429, 500, 503],
      },
    );
  }

  private extractFileKey(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match?.[1] || null;
  }

  private parseFileToDesign(file: FigmaAPIFile): FigmaDesign {
    const components: FigmaComponent[] = [];
    const colors: ColorToken[] = [];
    const typography: TypographyToken[] = [];

    this.traverseNodes(file.document, (node) => {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type,
          properties: {
            width: node.absoluteBoundingBox?.width,
            height: node.absoluteBoundingBox?.height,
            children: node.children?.length || 0,
          },
        });
      }

      if (node.fills?.length) {
        for (const fill of node.fills) {
          if (fill.type === 'SOLID' && fill.color) {
            const hex = this.rgbToHex(fill.color.r, fill.color.g, fill.color.b);
            if (!colors.find((c) => c.value === hex)) {
              colors.push({ name: node.name.toLowerCase().replace(/\s+/g, '-'), value: hex });
            }
          }
        }
      }

      if (node.style?.fontSize) {
        typography.push({
          name: node.name.toLowerCase().replace(/\s+/g, '-'),
          fontSize: `${node.style.fontSize / 16}rem`,
          fontWeight: String(node.style.fontWeight || 400),
          lineHeight: node.style.lineHeightPx
            ? `${node.style.lineHeightPx / 16}rem`
            : '1.5',
        });
      }
    });

    return {
      name: file.name,
      components,
      designTokens: {
        colors,
        typography,
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

  private traverseNodes(node: FigmaAPINode, callback: (node: FigmaAPINode) => void): void {
    callback(node);
    if (node.children) {
      for (const child of node.children) {
        this.traverseNodes(child, callback);
      }
    }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  generateReactCode(component: FigmaComponent): string {
    const componentName = component.name.replace(/[^a-zA-Z0-9]/g, '');
    return `import React from 'react';
import { cn } from '@/lib/utils';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export function ${componentName}({ className, children }: ${componentName}Props) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}
`;
  }

  generateTailwindConfig(tokens: DesignTokens): string {
    const colors = tokens.colors.reduce(
      (acc, t) => ({ ...acc, [t.name]: t.value }),
      {} as Record<string, string>,
    );
    const spacing = tokens.spacing.reduce(
      (acc, t) => ({ ...acc, [t.name]: t.value }),
      {} as Record<string, string>,
    );

    return JSON.stringify(
      {
        theme: {
          extend: {
            colors,
            spacing,
          },
        },
      },
      null,
      2,
    );
  }

  // --- Mock fallback ---
  private async fetchDesignMock(_figmaUrl: string): Promise<FigmaDesign> {
    await this.simulateDelay(500);
    return {
      name: 'Mock Design (set FIGMA_ACCESS_TOKEN for real API)',
      components: [
        { id: 'btn-1', name: 'Button', type: 'COMPONENT', properties: { variant: 'primary', size: 'md' } },
        { id: 'card-1', name: 'Card', type: 'COMPONENT', properties: { padding: '16px', shadow: true } },
        { id: 'input-1', name: 'Input', type: 'COMPONENT', properties: { type: 'text', placeholder: true } },
      ],
      designTokens: {
        colors: [
          { name: 'primary', value: '#3b82f6' },
          { name: 'secondary', value: '#8b5cf6' },
          { name: 'success', value: '#10b981' },
          { name: 'error', value: '#ef4444' },
        ],
        typography: [
          { name: 'heading-1', fontSize: '2.25rem', fontWeight: '700', lineHeight: '2.5rem' },
          { name: 'body', fontSize: '1rem', fontWeight: '400', lineHeight: '1.5rem' },
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

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
