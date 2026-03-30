import { create } from 'zustand';

interface Agent {
  id: string;
  name: string;
  type: 'design' | 'code-review' | 'test-gen' | 'task-mgmt';
  status: 'idle' | 'running' | 'completed' | 'error';
  result?: string;
}

interface ExecutionRecord {
  id: string;
  agentType: string;
  task: string;
  result: string | null;
  status: string;
  duration: number | null;
  createdAt: string;
  project?: { id: string; name: string } | null;
}

interface AgentState {
  agents: Agent[];
  activeAgent: Agent | null;
  executions: ExecutionRecord[];
  executionsLoading: boolean;
  executionsCursor: string | undefined;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  setActiveAgent: (agent: Agent | null) => void;
  clearAgents: () => void;
  setExecutions: (executions: ExecutionRecord[]) => void;
  appendExecutions: (executions: ExecutionRecord[]) => void;
  setExecutionsLoading: (loading: boolean) => void;
  setExecutionsCursor: (cursor: string | undefined) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  activeAgent: null,
  executions: [],
  executionsLoading: false,
  executionsCursor: undefined,
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    })),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  clearAgents: () => set({ agents: [], activeAgent: null }),
  setExecutions: (executions) => set({ executions }),
  appendExecutions: (executions) =>
    set((state) => ({ executions: [...state.executions, ...executions] })),
  setExecutionsLoading: (loading) => set({ executionsLoading: loading }),
  setExecutionsCursor: (cursor) => set({ executionsCursor: cursor }),
}));
