import { create } from 'zustand';

interface Agent {
  id: string;
  name: string;
  type: 'design' | 'code-review' | 'test-gen' | 'task-mgmt';
  status: 'idle' | 'running' | 'completed' | 'error';
  result?: string;
}

interface AgentState {
  agents: Agent[];
  activeAgent: Agent | null;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  setActiveAgent: (agent: Agent | null) => void;
  clearAgents: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  activeAgent: null,
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    })),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  clearAgents: () => set({ agents: [], activeAgent: null }),
}));
