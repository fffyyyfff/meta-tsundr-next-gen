import { test, expect } from '@playwright/test';

test.describe('Agent Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display agent dashboard', async ({ page }) => {
    const title = page.getByText('Execute AI Agent Task');
    await expect(title).toBeVisible();
  });

  test('should show empty state when no agents are running', async ({ page }) => {
    const emptyState = page.getByText('No agent results yet. Execute a task to see results here.');
    await expect(emptyState).toBeVisible();
  });
});
