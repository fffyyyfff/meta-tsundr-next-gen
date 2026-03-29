import { BaseAgent, AgentResult } from './base-agent';
import { DesignAgent } from './design-agent';
import { CodeReviewAgent } from './code-review-agent';
import { TestGenAgent } from './test-gen-agent';
import { TaskMgmtAgent } from './task-mgmt-agent';
import { contextStore } from '../services/context-store';

export type AgentType = 'design' | 'code-review' | 'test-gen' | 'task-mgmt';

const agentFactories: Record<AgentType, () => BaseAgent> = {
  design: () => new DesignAgent(),
  'code-review': () => new CodeReviewAgent(),
  'test-gen': () => new TestGenAgent(),
  'task-mgmt': () => new TaskMgmtAgent(),
};

export interface WorkflowStep {
  agentType: AgentType;
  task: string;
  result?: AgentResult;
}

export class Orchestrator {
  async executeAgent(agentType: AgentType, task: string): Promise<AgentResult> {
    const factory = agentFactories[agentType];
    if (!factory) {
      return {
        success: false,
        error: `Unknown agent type: ${agentType}`,
        agentType,
        duration: 0,
      };
    }

    const agent = factory();
    const result = await agent.execute(task);

    // Store context for cross-agent sharing
    if (result.success && result.result) {
      try {
        await contextStore.store({
          agentType,
          task,
          result: result.result,
          metadata: result.artifacts || {},
        });
      } catch {
        // Qdrant not available - continue without context storage
      }
    }

    return result;
  }

  async executeWorkflow(steps: WorkflowStep[]): Promise<WorkflowStep[]> {
    const results: WorkflowStep[] = [];

    for (const step of steps) {
      // Enrich task with previous step results
      let enrichedTask = step.task;
      if (results.length > 0) {
        const previousResults = results
          .filter((r) => r.result?.success)
          .map((r) => `[${r.agentType}の結果]: ${r.result?.result?.slice(0, 500)}`)
          .join('\n\n');
        enrichedTask = `${step.task}\n\n--- 前のステップの結果 ---\n${previousResults}`;
      }

      const result = await this.executeAgent(step.agentType, enrichedTask);
      results.push({ ...step, result });

      // Stop workflow if critical step fails
      if (!result.success) break;
    }

    return results;
  }

  async executeDesignToCodeWorkflow(task: string): Promise<WorkflowStep[]> {
    return this.executeWorkflow([
      { agentType: 'design', task },
      {
        agentType: 'code-review',
        task: '上記で生成されたコンポーネントコードをレビューしてください。',
      },
      {
        agentType: 'test-gen',
        task: '上記のコンポーネントに対するE2Eテストを生成してください。',
      },
      {
        agentType: 'task-mgmt',
        task: '上記の実装内容に基づき、残りの開発タスクを生成してください。',
      },
    ]);
  }
}

export const orchestrator = new Orchestrator();
