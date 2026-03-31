/**
 * FORGE App Store Screenshot Capture
 * iPhone 15 Pro Max: 1290×2796 (viewport 430×932 @3x)
 * Usage: node take_screenshots.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/ytata/forge_shots/node_modules/playwright');
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'http://localhost:8082';

// iPhone 15 Pro Max: 430×932 CSS px @3x = 1290×2796
const IPHONE = {
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function openDrawer(page) {
  // Try aria-label first
  const btn = page.locator('[aria-label="open drawer"], [aria-label="Open drawer"]').first();
  if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await btn.click();
  } else {
    // Hamburger is at top-left corner
    await page.mouse.click(28, 28);
  }
  await wait(700);
}

async function closeDrawer(page) {
  // Click right side to close drawer (outside drawer area)
  await page.mouse.click(380, 400);
  await wait(500);
}

async function navigateTo(page, label) {
  await openDrawer(page);
  // Wait for drawer items to appear
  await page.waitForSelector(`text=${label}`, { timeout: 3000 }).catch(() => {});
  const item = page.locator(`text=${label}`).first();
  if (await item.isVisible({ timeout: 2000 }).catch(() => false)) {
    await item.click();
    await wait(1000);
  } else {
    await closeDrawer(page);
  }
}

async function shoot(page, filename) {
  await wait(500);
  const out = path.join(OUT_DIR, filename);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`✅ Saved: ${filename}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    ...IPHONE,
    colorScheme: 'dark', // FORGE default is dark theme
  });
  const page = await context.newPage();

  // ── 1. Home Screen ──────────────────────────────────────────────────────────
  console.log('📸 1/5  Home screen...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await wait(1500);
  await shoot(page, 'screenshot_1.png');

  // ── 2. Exercise Select Screen ───────────────────────────────────────────────
  console.log('📸 2/5  Exercise Select screen...');
  // Navigate via drawer: click "トレーニング"
  await openDrawer(page);
  await wait(500);
  // Take snapshot to debug what's visible
  const drawerContent = await page.locator('text=トレーニング').all();
  console.log(`   Found ${drawerContent.length} "トレーニング" element(s)`);
  if (drawerContent.length > 0) {
    await drawerContent[0].click();
    await wait(1200);
  }
  await shoot(page, 'screenshot_2.png');

  // ── 3. RM Calculator Screen ─────────────────────────────────────────────────
  console.log('📸 3/5  RM Calculator screen...');
  await navigateTo(page, 'RM計算機');
  // Increase the values to make it look used
  const plusBtns = page.locator('text=+');
  for (let i = 0; i < 4; i++) {
    await plusBtns.first().click({ force: true }).catch(() => {});
    await wait(100);
  }
  await wait(400);
  await shoot(page, 'screenshot_3.png');

  // ── 4. Template Screen ──────────────────────────────────────────────────────
  console.log('📸 4/5  Template screen...');
  await navigateTo(page, 'テンプレート');
  await shoot(page, 'screenshot_4.png');

  // ── 5. Settings Screen ──────────────────────────────────────────────────────
  console.log('📸 5/5  Settings screen...');
  await navigateTo(page, '設定');
  await shoot(page, 'screenshot_5.png');

  await browser.close();
  console.log(`\n🎉 All screenshots saved to: ${OUT_DIR}`);
})();
