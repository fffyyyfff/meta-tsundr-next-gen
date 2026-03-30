import { test } from '@playwright/test';
import path from 'path';

const EVIDENCE_DIR = path.join(__dirname, '..', '..', 'evidence', 'screenshots');

test.describe('Evidence Capture', () => {
  test('01 - Home / Dashboard page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-home-dashboard.png'), fullPage: true });
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
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Focus on agent executor area
    const executor = page.locator('form').first();
    if (await executor.isVisible()) {
      await executor.screenshot({ path: path.join(EVIDENCE_DIR, '04-agent-executor.png') });
    } else {
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '04-agent-executor.png'), fullPage: true });
    }
  });
});
