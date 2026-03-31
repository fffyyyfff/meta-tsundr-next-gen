import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');

    // ページタイトルを確認
    await expect(page).toHaveTitle(/Meta-tsundr/);
  });

  test('should have AI Agent Dashboard', async ({ page }) => {
    await page.goto('/');

    // メイン見出しが表示されることを確認
    const heading = page.getByRole('heading', { name: 'Meta-tsundr Next Gen' });
    await expect(heading).toBeVisible();
  });
});
