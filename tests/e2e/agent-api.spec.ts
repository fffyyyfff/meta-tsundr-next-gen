import { test, expect } from '@playwright/test';

test.describe('tRPC agent.listAgents', () => {
  test('should return list of available agents', async ({ request }) => {
    // tRPC GET query for listAgents
    const response = await request.get('/api/trpc/agent.listAgents', {
      params: { input: '{}' },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('result');
    expect(body.result).toHaveProperty('data');

    const agents = body.result.data;
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThanOrEqual(4);
  });

  test('should include all expected agent types', async ({ request }) => {
    const response = await request.get('/api/trpc/agent.listAgents', {
      params: { input: '{}' },
    });
    const body = await response.json();
    const agents = body.result.data;

    const types = agents.map((a: { type: string }) => a.type);
    expect(types).toContain('design');
    expect(types).toContain('code-review');
    expect(types).toContain('test-gen');
    expect(types).toContain('task-mgmt');
  });

  test('should return agents with required fields', async ({ request }) => {
    const response = await request.get('/api/trpc/agent.listAgents', {
      params: { input: '{}' },
    });
    const body = await response.json();
    const agents = body.result.data;

    for (const agent of agents) {
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('type');
      expect(agent).toHaveProperty('description');
      expect(typeof agent.id).toBe('string');
      expect(typeof agent.name).toBe('string');
      expect(typeof agent.type).toBe('string');
      expect(typeof agent.description).toBe('string');
    }
  });

  test('should have correct agent names', async ({ request }) => {
    const response = await request.get('/api/trpc/agent.listAgents', {
      params: { input: '{}' },
    });
    const body = await response.json();
    const agents = body.result.data;

    const names = agents.map((a: { name: string }) => a.name);
    expect(names).toContain('Design Agent');
    expect(names).toContain('Code Review Agent');
    expect(names).toContain('Test Generation Agent');
    expect(names).toContain('Task Management Agent');
  });
});
