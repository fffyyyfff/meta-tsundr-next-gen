// Linear MCP Service - Linear GraphQL API integration

export interface LinearIssue {
  id: string;
  title: string;
  description: string | null;
  state: string;
  priority: number;
  assigneeId: string | null;
  projectId: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LinearProject {
  id: string;
  name: string;
  description: string | null;
  state: string;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

interface LinearGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export class LinearMCPService {
  private apiKey: string | null;
  private baseUrl = 'https://api.linear.app/graphql';

  constructor() {
    this.apiKey = process.env.LINEAR_API_KEY || null;
  }

  private get isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey !== 'your_linear_api_key_here';
  }

  private async query<T>(graphql: string, variables?: Record<string, unknown>): Promise<T> {
    if (!this.isConfigured) {
      throw new Error('LINEAR_API_KEY is not configured');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.apiKey!,
      },
      body: JSON.stringify({ query: graphql, variables }),
    });

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as LinearGraphQLResponse<T>;
    if (result.errors?.length) {
      throw new Error(`Linear GraphQL error: ${result.errors[0].message}`);
    }

    return result.data;
  }

  async listIssues(params?: {
    teamId?: string;
    projectId?: string;
    limit?: number;
  }): Promise<LinearIssue[]> {
    if (!this.isConfigured) return this.listIssuesMock();

    const filters: string[] = [];
    if (params?.teamId) filters.push(`team: { id: { eq: "${params.teamId}" } }`);
    if (params?.projectId) filters.push(`project: { id: { eq: "${params.projectId}" } }`);
    const filterStr = filters.length ? `filter: { ${filters.join(', ')} }` : '';

    const data = await this.query<{
      issues: { nodes: Array<Record<string, unknown>> };
    }>(`
      query {
        issues(first: ${params?.limit || 50} ${filterStr}) {
          nodes {
            id title description priority createdAt updatedAt
            state { name }
            assignee { id }
            project { id }
            labels { nodes { name } }
          }
        }
      }
    `);

    return data.issues.nodes.map(this.mapIssue);
  }

  async getIssue(id: string): Promise<LinearIssue> {
    if (!this.isConfigured) return this.getIssueMock(id);

    const data = await this.query<{ issue: Record<string, unknown> }>(`
      query { issue(id: "${id}") {
        id title description priority createdAt updatedAt
        state { name }
        assignee { id }
        project { id }
        labels { nodes { name } }
      }}
    `);

    return this.mapIssue(data.issue);
  }

  async createIssue(params: {
    title: string;
    description?: string;
    teamId: string;
    projectId?: string;
    priority?: number;
    labelIds?: string[];
  }): Promise<LinearIssue> {
    if (!this.isConfigured) return this.createIssueMock(params);

    const data = await this.query<{
      issueCreate: { issue: Record<string, unknown> };
    }>(
      `mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          issue {
            id title description priority createdAt updatedAt
            state { name }
            assignee { id }
            project { id }
            labels { nodes { name } }
          }
        }
      }`,
      {
        input: {
          title: params.title,
          description: params.description,
          teamId: params.teamId,
          projectId: params.projectId,
          priority: params.priority || 0,
          labelIds: params.labelIds,
        },
      },
    );

    return this.mapIssue(data.issueCreate.issue);
  }

  async updateIssue(
    id: string,
    params: { title?: string; description?: string; stateId?: string; priority?: number },
  ): Promise<LinearIssue> {
    if (!this.isConfigured) return this.getIssueMock(id);

    const data = await this.query<{
      issueUpdate: { issue: Record<string, unknown> };
    }>(
      `mutation($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          issue {
            id title description priority createdAt updatedAt
            state { name }
            assignee { id }
            project { id }
            labels { nodes { name } }
          }
        }
      }`,
      { id, input: params },
    );

    return this.mapIssue(data.issueUpdate.issue);
  }

  async syncIssues(teamId: string): Promise<{ synced: number; issues: LinearIssue[] }> {
    const issues = await this.listIssues({ teamId });
    return { synced: issues.length, issues };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapIssue(raw: any): LinearIssue {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description || null,
      state: raw.state?.name || 'Unknown',
      priority: raw.priority || 0,
      assigneeId: raw.assignee?.id || null,
      projectId: raw.project?.id || null,
      labels: raw.labels?.nodes?.map((l: { name: string }) => l.name) || [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  // --- Mock fallback ---
  private listIssuesMock(): LinearIssue[] {
    return [
      {
        id: 'mock-1',
        title: '[Mock] Implement login page',
        description: 'Create a responsive login page',
        state: 'In Progress',
        priority: 1,
        assigneeId: null,
        projectId: null,
        labels: ['frontend', 'auth'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mock-2',
        title: '[Mock] API rate limiting',
        description: 'Add rate limiting to API endpoints',
        state: 'Todo',
        priority: 2,
        assigneeId: null,
        projectId: null,
        labels: ['backend', 'security'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private getIssueMock(id: string): LinearIssue {
    return {
      id,
      title: `[Mock] Issue ${id}`,
      description: 'Mock issue (set LINEAR_API_KEY for real API)',
      state: 'Todo',
      priority: 1,
      assigneeId: null,
      projectId: null,
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private createIssueMock(params: { title: string; description?: string }): LinearIssue {
    return {
      id: `mock-${Date.now()}`,
      title: params.title,
      description: params.description || null,
      state: 'Todo',
      priority: 0,
      assigneeId: null,
      projectId: null,
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
