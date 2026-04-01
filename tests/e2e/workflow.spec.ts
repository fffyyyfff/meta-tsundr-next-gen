import { test, expect } from '@playwright/test';

test.describe('Workflow Runner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display Design-to-Code workflow card', async ({ page }) => {
    const title = page.getByText('Design-to-Code Workflow');
    await expect(title).toBeVisible();
  });

  test('should display workflow description', async ({ page }) => {
    await expect(
      page.getByText('Run the full pipeline'),
    ).toBeVisible();
  });

  test('should have task input field', async ({ page }) => {
    const input = page.locator('#workflow-task');
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();
  });

  test('should have run button disabled when input is empty', async ({ page }) => {
    const runButton = page.getByRole('button', { name: 'Run Design-to-Code' });
    await expect(runButton).toBeVisible();
    await expect(runButton).toBeDisabled();
  });

  test('should enable run button when task is entered', async ({ page }) => {
    const input = page.locator('#workflow-task');
    await input.fill('Convert the login page design from Figma');

    const runButton = page.getByRole('button', { name: 'Run Design-to-Code' });
    await expect(runButton).toBeEnabled();
  });

  test('should show placeholder text in input', async ({ page }) => {
    const input = page.locator('#workflow-task');
    await expect(input).toHaveAttribute(
      'placeholder',
      'e.g. Convert the login page design from Figma...',
    );
  });

  test('should not show step progress before running', async ({ page }) => {
    await expect(page.getByText('Progress')).not.toBeVisible();
    await expect(page.getByText('Design Extraction')).not.toBeVisible();
  });
});
