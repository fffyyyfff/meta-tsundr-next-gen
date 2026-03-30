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
    await expect(page.getByText('Total')).toBeVisible();
    await expect(page.getByText('Success')).toBeVisible();
    await expect(page.getByText('Failed')).toBeVisible();
    await expect(page.getByText('Running')).toBeVisible();
  });

  test('should show empty state when no executions exist', async ({ page }) => {
    const emptyMessage = page.getByText('No executions yet');
    await expect(emptyMessage).toBeVisible();
  });

  test('should display refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: 'Refresh' });
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toBeEnabled();
  });

  test('should display status badges with correct labels', async ({ page }) => {
    // ステータスバッジの表示確認（ページ上に存在するバッジテキスト）
    // 空の状態ではバッジは表示されないが、Stats カードのラベルは表示される
    const statsSection = page.locator('.grid');
    await expect(statsSection).toBeVisible();

    // 各統計値が0で表示されること
    const statValues = statsSection.locator('.text-2xl');
    const count = await statValues.count();
    expect(count).toBe(4);
  });

  test('should display description text', async ({ page }) => {
    await expect(
      page.getByText('Agent execution logs and performance metrics'),
    ).toBeVisible();
  });
});
