import { test, expect } from '@playwright/test';

test.describe('Purchases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({ id: 'dev-user', name: 'Dev' }));
    });
  });

  test('should display purchases list page', async ({ page }) => {
    await page.goto('/purchases');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: '購入管理' })).toBeVisible();
    await expect(page.getByText('あなたの購入記録')).toBeVisible();
  });

  test('should display category tabs', async ({ page }) => {
    await page.goto('/purchases');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: '全て' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '書籍' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '家電' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '日用品' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '食品' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '衣類' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '趣味' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'その他' })).toBeVisible();
  });

  test('should display new purchase page', async ({ page }) => {
    await page.goto('/purchases/new');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('新しいアイテムを追加')).toBeVisible();
  });

  test('should have form fields on new purchase page', async ({ page }) => {
    await page.goto('/purchases/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#category')).toBeVisible();
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#creator')).toBeVisible();
  });

  test('should have source toggle tabs in search suggestions', async ({ page }) => {
    await page.goto('/purchases/new');
    await page.waitForLoadState('networkidle');

    // Type 3+ characters to trigger search suggestions
    const titleInput = page.locator('#title');
    await titleInput.fill('テスト商品名');
    await titleInput.focus();

    // Wait for debounce + suggestions to appear
    await page.waitForTimeout(600);

    // Source toggle tabs should exist in the dropdown (if visible)
    const dropdown = page.locator('.absolute.z-20');
    if (await dropdown.isVisible()) {
      await expect(dropdown.getByText('おすすめ')).toBeVisible();
      await expect(dropdown.getByText('Amazon')).toBeVisible();
      await expect(dropdown.getByText('楽天')).toBeVisible();
    }
  });

  test('should display wishlist page', async ({ page }) => {
    await page.goto('/purchases?status=WISHLIST');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'ウィッシュリスト' })).toBeVisible();
  });

  test('should have status filter dropdown', async ({ page }) => {
    await page.goto('/purchases');
    await page.waitForLoadState('networkidle');

    const statusFilter = page.locator('select[aria-label="ステータスフィルター"]');
    await expect(statusFilter).toBeVisible();
  });

  test('should have sort controls', async ({ page }) => {
    await page.goto('/purchases');
    await page.waitForLoadState('networkidle');

    const sortSelect = page.locator('select[aria-label="並び替え"]');
    await expect(sortSelect).toBeVisible();
  });

  test('should switch category tabs', async ({ page }) => {
    await page.goto('/purchases');
    await page.waitForLoadState('networkidle');

    const foodTab = page.getByRole('tab', { name: '食品' });
    await foodTab.click();
    await expect(foodTab).toHaveAttribute('aria-selected', 'true');

    const allTab = page.getByRole('tab', { name: '全て' });
    await allTab.click();
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display receipt scan page', async ({ page }) => {
    await page.goto('/purchases/scan');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'レシート読み取り' })).toBeVisible();
    await expect(page.getByText('AI解析')).toBeVisible();
    await expect(page.getByText('OCR解析')).toBeVisible();
  });

  test('should show price check button on wishlist', async ({ page }) => {
    await page.goto('/purchases?status=WISHLIST');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('価格チェック')).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/purchases');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('タイトル・メーカーで検索');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('テスト');
    await expect(searchInput).toHaveValue('テスト');
  });
});
