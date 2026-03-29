import { Page } from '@playwright/test';

export async function waitForNextJsHydration(page: Page) {
  await page.waitForFunction(() => {
    return (window as any).next?.router !== undefined;
  });
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
}
