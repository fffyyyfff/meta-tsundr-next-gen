import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
  });

  test('should navigate from home to books via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const booksLink = page.locator('nav[aria-label="サイドナビゲーション"] a', { hasText: '積読管理' });
    await expect(booksLink).toBeVisible();
    await booksLink.click();
    await page.waitForURL('/books');

    await expect(page.getByRole('heading', { name: '積読管理' })).toBeVisible();
  });

  test('should navigate from home to purchases via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const purchasesLink = page.locator('nav[aria-label="サイドナビゲーション"] a', { hasText: '購入管理' });
    await expect(purchasesLink).toBeVisible();
    await purchasesLink.click();
    await page.waitForURL('/purchases');

    await expect(page.getByRole('heading', { name: '購入管理' })).toBeVisible();
  });

  test('should navigate from home to dashboard via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const dashboardLink = page.locator('nav[aria-label="サイドナビゲーション"] a', { hasText: 'AI ダッシュボード' });
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
    await page.waitForURL('/dashboard');
  });

  test('should navigate full flow: home → books → purchases → dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sideNav = page.locator('nav[aria-label="サイドナビゲーション"]');

    // Home → Books
    await sideNav.locator('a', { hasText: '積読管理' }).click();
    await page.waitForURL('/books');
    await expect(page.getByRole('heading', { name: '積読管理' })).toBeVisible();

    // Books → Purchases
    await sideNav.locator('a', { hasText: '購入管理' }).click();
    await page.waitForURL('/purchases');
    await expect(page.getByRole('heading', { name: '購入管理' })).toBeVisible();

    // Purchases → Dashboard
    await sideNav.locator('a', { hasText: 'AI ダッシュボード' }).click();
    await page.waitForURL('/dashboard');

    // Dashboard → Home
    await sideNav.locator('a', { hasText: 'ホーム' }).click();
    await page.waitForURL('/');
  });

  test('should have sidebar with all navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sideNav = page.locator('nav[aria-label="サイドナビゲーション"]');
    await expect(sideNav.locator('a', { hasText: 'ホーム' })).toBeVisible();
    await expect(sideNav.locator('a', { hasText: '積読管理' })).toBeVisible();
    await expect(sideNav.locator('a', { hasText: '購入管理' })).toBeVisible();
    await expect(sideNav.locator('a', { hasText: 'AI ダッシュボード' })).toBeVisible();
  });
});
