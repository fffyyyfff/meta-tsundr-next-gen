import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Meta-tsundr/);
  });

  test('should show home page with Meta-tsundr heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: 'Meta-tsundr' });
    await expect(heading).toBeVisible();
  });

  test('should display three menu cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('あなたの読書記録を管理')).toBeVisible();
    await expect(page.getByText('読書の傾向を分析')).toBeVisible();
    await expect(page.getByText('AIエージェント管理')).toBeVisible();
  });
});
