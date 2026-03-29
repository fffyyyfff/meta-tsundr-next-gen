// Playwright MCP Service - Test generation and healing

export interface TestScenario {
  name: string;
  description: string;
  steps: TestStep[];
}

export interface TestStep {
  action: 'navigate' | 'click' | 'fill' | 'assert' | 'wait';
  target?: string;
  value?: string;
  description: string;
}

export interface TestCase {
  name: string;
  code: string;
  scenario: TestScenario;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  brokenSelectors?: string[];
}

export class PlaywrightMCPService {
  generateTestFromDescription(description: string): TestCase {
    const scenario = this.parseDescription(description);
    const code = this.generateTestCode(scenario);
    return { name: scenario.name, code, scenario };
  }

  generateTestsForComponent(componentName: string, props: Record<string, unknown>): TestCase[] {
    const tests: TestCase[] = [];

    // Render test
    tests.push(
      this.createTestCase(`${componentName} renders correctly`, [
        { action: 'navigate', target: '/', description: 'Navigate to page' },
        {
          action: 'assert',
          target: `[data-testid="${componentName.toLowerCase()}"]`,
          value: 'visible',
          description: `Assert ${componentName} is visible`,
        },
      ]),
    );

    // Interaction tests based on props
    if (props.onClick || props.variant) {
      tests.push(
        this.createTestCase(`${componentName} handles click`, [
          { action: 'navigate', target: '/', description: 'Navigate to page' },
          {
            action: 'click',
            target: `[data-testid="${componentName.toLowerCase()}"]`,
            description: `Click ${componentName}`,
          },
        ]),
      );
    }

    if (props.value !== undefined || props.onChange) {
      tests.push(
        this.createTestCase(`${componentName} handles input`, [
          { action: 'navigate', target: '/', description: 'Navigate to page' },
          {
            action: 'fill',
            target: `[data-testid="${componentName.toLowerCase()}"]`,
            value: 'test input',
            description: `Fill ${componentName} with text`,
          },
          {
            action: 'assert',
            target: `[data-testid="${componentName.toLowerCase()}"]`,
            value: 'test input',
            description: 'Assert input value',
          },
        ]),
      );
    }

    return tests;
  }

  healBrokenTest(testResult: TestResult): {
    suggestions: Array<{ oldSelector: string; newSelector: string; confidence: number }>;
    healedCode: string | null;
  } {
    if (!testResult.brokenSelectors?.length) {
      return { suggestions: [], healedCode: null };
    }

    const suggestions = testResult.brokenSelectors.map((selector) => {
      // Suggest data-testid based alternatives
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return {
          oldSelector: selector,
          newSelector: `[data-testid="${className}"]`,
          confidence: 0.7,
        };
      }
      if (selector.startsWith('#')) {
        return {
          oldSelector: selector,
          newSelector: `[data-testid="${selector.slice(1)}"]`,
          confidence: 0.8,
        };
      }
      // For complex selectors, suggest role-based
      return {
        oldSelector: selector,
        newSelector: `role=${this.guessRole(selector)}`,
        confidence: 0.5,
      };
    });

    return { suggestions, healedCode: null };
  }

  private parseDescription(description: string): TestScenario {
    const steps: TestStep[] = [];
    const lines = description
      .split(/[.\n]/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('navigate') || lower.includes('go to') || lower.includes('open')) {
        const urlMatch = line.match(/(?:to|open)\s+(\S+)/i);
        steps.push({
          action: 'navigate',
          target: urlMatch?.[1] || '/',
          description: line,
        });
      } else if (lower.includes('click')) {
        const targetMatch = line.match(/click\s+(?:on\s+)?(?:the\s+)?["']?([^"']+)["']?/i);
        steps.push({
          action: 'click',
          target: targetMatch?.[1]?.trim() || 'button',
          description: line,
        });
      } else if (lower.includes('type') || lower.includes('enter') || lower.includes('fill')) {
        const match = line.match(/(?:type|enter|fill)\s+["']([^"']+)["']/i);
        steps.push({
          action: 'fill',
          target: 'input',
          value: match?.[1] || 'test',
          description: line,
        });
      } else if (lower.includes('should') || lower.includes('verify') || lower.includes('assert') || lower.includes('see')) {
        steps.push({
          action: 'assert',
          target: 'page',
          value: line,
          description: line,
        });
      } else if (lower.includes('wait')) {
        steps.push({
          action: 'wait',
          value: '1000',
          description: line,
        });
      }
    }

    if (steps.length === 0) {
      steps.push({
        action: 'navigate',
        target: '/',
        description: 'Navigate to home page',
      });
      steps.push({
        action: 'assert',
        target: 'page',
        value: description,
        description: `Verify: ${description}`,
      });
    }

    return {
      name: description.slice(0, 60).replace(/[^a-zA-Z0-9\s]/g, ''),
      description,
      steps,
    };
  }

  private createTestCase(name: string, steps: TestStep[]): TestCase {
    const scenario: TestScenario = { name, description: name, steps };
    return { name, code: this.generateTestCode(scenario), scenario };
  }

  private generateTestCode(scenario: TestScenario): string {
    const steps = scenario.steps
      .map((step) => {
        switch (step.action) {
          case 'navigate':
            return `  await page.goto('${step.target}');`;
          case 'click':
            return `  await page.locator('${step.target}').click();`;
          case 'fill':
            return `  await page.locator('${step.target}').fill('${step.value}');`;
          case 'assert':
            return `  await expect(page.locator('${step.target}')).toBeVisible();`;
          case 'wait':
            return `  await page.waitForTimeout(${step.value});`;
          default:
            return `  // ${step.description}`;
        }
      })
      .join('\n');

    return `import { test, expect } from '@playwright/test';

test('${scenario.name}', async ({ page }) => {
${steps}
});
`;
  }

  private guessRole(selector: string): string {
    const lower = selector.toLowerCase();
    if (lower.includes('button') || lower.includes('btn')) return 'button';
    if (lower.includes('input') || lower.includes('field')) return 'textbox';
    if (lower.includes('link') || lower.includes('anchor')) return 'link';
    if (lower.includes('heading') || lower.includes('title')) return 'heading';
    return 'generic';
  }
}
