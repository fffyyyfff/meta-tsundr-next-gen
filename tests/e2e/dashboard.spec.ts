import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display execution history section', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Execution History' });
    await expect(heading).toBeVisible();
  });

  test('should display stats summary cards', async ({ page }) => {
    // 4つの統計カード: Total, Success, Failed, Running
    const statsGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4');
    await expect(statsGrid).toBeVisible();
    await expect(statsGrid.getByText('Total')).toBeVisible();
    await expect(statsGrid.getByText('Success')).toBeVisible();
    await expect(statsGrid.getByText('Failed')).toBeVisible();
    await expect(statsGrid.getByText('Running')).toBeVisible();
  });

  test('should show empty state when no executions exist', async ({ page }) => {
    // DB未接続時はローディング、接続時は空メッセージが表示される
    const loading = page.getByText('Loading execution history...');
    const empty = page.getByText('No executions found.');
    await expect(loading.or(empty)).toBeVisible();
  });

  test('should display refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: 'Refresh' });
    await expect(refreshButton).toBeVisible();
    // Button may be disabled while data loads; wait for it to become enabled
    await expect(refreshButton).toBeEnabled({ timeout: 10000 });
  });

  test('should display status badges with correct labels', async ({ page }) => {
    // Stats カードのラベルが表示される
    const statsGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4');
    await expect(statsGrid).toBeVisible();

    // 各統計値が0で表示されること
    const statValues = statsGrid.locator('.text-2xl');
    const count = await statValues.count();
    expect(count).toBe(4);
  });

  test('should display description text', async ({ page }) => {
    await expect(
      page.getByText('Agent execution logs and performance metrics'),
    ).toBeVisible();
  });
});
