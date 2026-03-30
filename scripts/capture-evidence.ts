import { chromium } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'evidence', 'screenshots');
const BASE_URL = 'http://localhost:3000';

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const pages = [
    { url: '/', name: '01-home-dashboard' },
    { url: '/login', name: '02-login-page' },
  ];

  for (const p of pages) {
    try {
      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${p.name}.png`), fullPage: true });
      console.log(`✅ ${p.name}.png captured`);
    } catch (e) {
      console.log(`⚠️ ${p.name} - ${e instanceof Error ? e.message : 'failed'}`);
    }
  }

  // API health check screenshot (JSON response)
  try {
    await page.goto(`${BASE_URL}/api/health`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-health-api.png') });
    console.log('✅ 03-health-api.png captured');
  } catch (e) {
    console.log(`⚠️ health-api - ${e instanceof Error ? e.message : 'failed'}`);
  }

  await browser.close();
  console.log('\n📸 Evidence screenshots saved to evidence/screenshots/');
}

capture().catch(console.error);
