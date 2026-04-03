import { test, expect } from '@playwright/test';

test.describe('/api/health endpoint', () => {
  test('should return valid health response', async ({ request }) => {
    const response = await request.get('/api/health');

    // ステータスコードが200または503であること
    expect([200, 503]).toContain(response.status());

    const body = await response.json();

    // 必須フィールドの存在確認
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('checks');
  });

  test('should return valid status value', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
  });

  test('should return version string', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    expect(typeof body.version).toBe('string');
    expect(body.version.length).toBeGreaterThan(0);
  });

  test('should return uptime as number', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('should include service checks', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    // checks はオブジェクトであること
    expect(typeof body.checks).toBe('object');
    expect(body.checks).not.toBeNull();

    // database, anthropic の各チェック項目が存在すること
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('anthropic');
  });

  test('should have status field in each check', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    for (const [, check] of Object.entries(body.checks)) {
      expect(check).toHaveProperty('status');
      expect(typeof (check as Record<string, unknown>).status).toBe('string');
    }
  });
});
