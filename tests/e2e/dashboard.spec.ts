import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard page', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'AI ダッシュボード' });
    await expect(heading).toBeVisible();
  });

  test('should have AgentExecutor form', async ({ page }) => {
    await expect(page.getByText('Execute AI Agent Task')).toBeVisible();
  });

  test('should display execution history section', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Execution History' });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
  });

  test('should display workflow runner', async ({ page }) => {
    await expect(page.getByText('Design-to-Code Workflow')).toBeVisible();
  });
});
