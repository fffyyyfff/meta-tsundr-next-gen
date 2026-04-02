import { test } from '@playwright/test';
import path from 'path';

const EVIDENCE_DIR = path.join(__dirname, '..', '..', 'evidence', 'screenshots');

test.describe('Evidence Capture', () => {
  test('01 - Home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-home.png'), fullPage: true });
  });

  test('02 - Login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02-login-page.png'), fullPage: true });
  });

  test('03 - Health API endpoint', async ({ page }) => {
    await page.goto('/api/health');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03-health-api.png') });
  });

  test('04 - Agent executor form', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const executor = page.locator('form').first();
    if (await executor.isVisible()) {
      await executor.screenshot({ path: path.join(EVIDENCE_DIR, '04-agent-executor.png') });
    } else {
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '04-agent-executor.png'), fullPage: true });
    }
  });

  test('05 - Dark mode home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '05-dark-mode-home.png'), fullPage: true });
  });

  test('06 - Login page (mobile viewport)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06-login-mobile.png'), fullPage: true });
    await context.close();
  });

  test('07 - Books list page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/books');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '07-books-list.png'), fullPage: true });
  });

  test('08 - Books new page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/books/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '08-books-new.png'), fullPage: true });
  });

  test('09 - Books stats page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/books/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09-books-stats.png'), fullPage: true });
  });

  test('10 - Dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '10-dashboard.png'), fullPage: true });
  });

  test('11 - Sidebar expanded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const sidebar = page.locator('aside');
    if (await sidebar.isVisible()) {
      await sidebar.screenshot({ path: path.join(EVIDENCE_DIR, '11-sidebar.png') });
    } else {
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '11-sidebar.png') });
    }
  });

  test('12 - Purchases list page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/purchases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '12-purchases-list.png'), fullPage: true });
  });

  test('13 - Purchases new page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/purchases/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '13-purchases-new.png'), fullPage: true });
  });

  test('14 - Purchases stats page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    // Stats page may not exist yet; capture whatever renders at this path
    await page.goto('/purchases/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '14-purchases-stats.png'), fullPage: true });
  });

  test('15 - Wishlist page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/purchases?status=WISHLIST');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '15-wishlist.png'), fullPage: true });
  });
});
