import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');

    // ページタイトルを確認
    await expect(page).toHaveTitle(/Meta-tsundr/);
  });

  test('should have AI Agent Dashboard', async ({ page }) => {
    await page.goto('/');

    // ダッシュボードが表示されることを確認
    const dashboard = page.locator('text=AI Agent Dashboard');
    await expect(dashboard).toBeVisible();
  });
});
