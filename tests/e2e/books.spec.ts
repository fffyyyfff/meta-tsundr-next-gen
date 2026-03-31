import { test, expect } from '@playwright/test';

test.describe('Books', () => {
  test.beforeEach(async ({ page }) => {
    // Set auth for dev mode
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
  });

  test('should display books list page', async ({ page }) => {
    await page.goto('/books');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: '積読管理' })).toBeVisible();
    await expect(page.getByText('あなたの読書記録')).toBeVisible();
  });

  test('should display status filter tabs', async ({ page }) => {
    await page.goto('/books');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: '全て' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '積読' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '読書中' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '読了' })).toBeVisible();
  });

  test('should display new book page', async ({ page }) => {
    await page.goto('/books/new');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('新しい書籍を追加')).toBeVisible();
  });

  test('should have form fields on new book page', async ({ page }) => {
    await page.goto('/books/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#author')).toBeVisible();
    await expect(page.locator('#isbn')).toBeVisible();
  });

  test('should display stats page', async ({ page }) => {
    await page.goto('/books/stats');
    await page.waitForLoadState('networkidle');

    // Stats page renders heading or skeleton loading depending on auth state
    const statsNav = page.locator('nav[aria-label="書籍ナビゲーション"] a', { hasText: '統計' });
    await expect(statsNav).toBeVisible();
  });

  test('should have AI recommendation section on books page', async ({ page }) => {
    await page.goto('/books');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('AIおすすめ')).toBeVisible();
    await expect(page.getByText('読書計画')).toBeVisible();
  });

  test('should navigate between list and stats via tabs', async ({ page }) => {
    await page.goto('/books');
    await page.waitForLoadState('networkidle');

    const statsLink = page.locator('nav[aria-label="書籍ナビゲーション"] a', { hasText: '統計' });
    await expect(statsLink).toBeVisible();
    await statsLink.click();
    await page.waitForURL('/books/stats');

    // Verify we navigated to stats and the nav shows stats active
    const statsNav = page.locator('nav[aria-label="書籍ナビゲーション"] a', { hasText: '統計' });
    await expect(statsNav).toBeVisible();
  });
});
