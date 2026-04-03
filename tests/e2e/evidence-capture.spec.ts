import { test } from '@playwright/test';
import { rmSync, mkdirSync } from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'evidence', 'screenshots');

test.describe('Evidence Capture - UI Redesign', () => {
  test.beforeAll(() => {
    // Clean old screenshots and recreate directory
    rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test('01-home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-home.png'), fullPage: true });
  });

  test('02-books-list', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/books');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-books-list.png'), fullPage: true });
  });

  test('03-books-new', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/books/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-books-new.png'), fullPage: true });
  });

  test('04-books-stats', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/books/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-books-stats.png'), fullPage: true });
  });

  test('05-purchases-list', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/purchases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-purchases-list.png'), fullPage: true });
  });

  test('06-purchases-new', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/purchases/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-purchases-new.png'), fullPage: true });
  });

  test('07-purchases-stats', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/purchases/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-purchases-stats.png'), fullPage: true });
  });

  test('08-wishlist', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
    await page.goto('/purchases?status=WISHLIST');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-wishlist.png'), fullPage: true });
  });

  test('09-dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-dashboard.png'), fullPage: true });
  });

  test('10-login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-login.png'), fullPage: true });
  });

  test('11-dark-home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-dark-home.png'), fullPage: true });
  });

  test('12-health-api', async ({ page }) => {
    await page.goto('/api/health');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-health-api.png'), fullPage: true });
  });
});
