import { test, expect } from '@playwright/test';

test.describe('Agent Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display agent dashboard', async ({ page }) => {
    const dashboard = page.locator('text=AI Agent Dashboard');
    await expect(dashboard).toBeVisible();
  });

  test('should show empty state when no agents are running', async ({ page }) => {
    const emptyState = page.locator('text=No agents running');
    await expect(emptyState).toBeVisible();
  });
});
