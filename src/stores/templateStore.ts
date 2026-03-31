import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentType = 'design' | 'code-review' | 'test-gen' | 'task-mgmt';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  agentType: AgentType;
  prompt: string;
  category: 'preset' | 'custom';
  createdAt: string;
  updatedAt: string;
}

const PRESET_TEMPLATES: TaskTemplate[] = [
  {
    id: 'preset-component-gen',
    name: 'Component Generation',
    description: 'Generate a React component from a design specification',
    agentType: 'design',
    prompt: 'Generate a React component for {{componentName}}. Requirements: {{requirements}}',
    category: 'preset',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset-code-review',
    name: 'Code Review',
    description: 'Review code for quality, security, and best practices',
    agentType: 'code-review',
    prompt: 'Review the following code in {{filePath}} for: 1) Security vulnerabilities 2) Performance issues 3) Best practices. Focus on: {{focusAreas}}',
    category: 'preset',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset-test-gen',
    name: 'Test Generation',
    description: 'Generate Playwright E2E tests for a page or component',
    agentType: 'test-gen',
    prompt: 'Generate Playwright E2E tests for {{targetPage}}. Cover: {{testScenarios}}',
    category: 'preset',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset-task-decompose',
    name: 'Task Decomposition',
    description: 'Break down a large task into subtasks with estimates',
    agentType: 'task-mgmt',
    prompt: 'Decompose the following task into subtasks: {{taskDescription}}. Include estimated effort and dependencies for each subtask.',
    category: 'preset',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset-figma-convert',
    name: 'Figma Design Conversion',
    description: 'Convert a Figma design to code with design tokens',
    agentType: 'design',
    prompt: 'Convert the Figma design at {{figmaUrl}} to React components. Extract design tokens and generate responsive layout for {{breakpoints}}.',
    category: 'preset',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

interface TemplateState {
  templates: TaskTemplate[];
  add: (template: Omit<TaskTemplate, 'id' | 'category' | 'createdAt' | 'updatedAt'>) => void;
  update: (id: string, updates: Partial<Pick<TaskTemplate, 'name' | 'description' | 'agentType' | 'prompt'>>) => void;
  remove: (id: string) => void;
  getById: (id: string) => TaskTemplate | undefined;
  getByAgentType: (agentType: AgentType) => TaskTemplate[];
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: PRESET_TEMPLATES,
      add: (template) => {
        const now = new Date().toISOString();
        const newTemplate: TaskTemplate = {
          ...template,
          id: `custom-${Date.now()}`,
          category: 'custom',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ templates: [...state.templates, newTemplate] }));
      },
      update: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
          ),
        })),
      remove: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id || t.category === 'preset'),
        })),
      getById: (id) => get().templates.find((t) => t.id === id),
      getByAgentType: (agentType) => get().templates.filter((t) => t.agentType === agentType),
    }),
    {
      name: 'meta-tsundr-templates',
      merge: (persisted, current) => {
        const saved = persisted as TemplateState | undefined;
        if (!saved) return current;
        // Ensure presets are always present and up-to-date
        const customTemplates = (saved.templates ?? []).filter((t) => t.category === 'custom');
        return { ...current, templates: [...PRESET_TEMPLATES, ...customTemplates] };
      },
    },
  ),
);

/**
 * Replace {{variable}} placeholders with provided values.
 */
export function expandTemplate(prompt: string, variables: Record<string, string>): string {
  return prompt.replace(/\{\{(\w+)\}\}/g, (match, key: string) => variables[key] ?? match);
}

/**
 * Extract variable names from a prompt template.
 */
export function extractVariables(prompt: string): string[] {
  const matches = prompt.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}
