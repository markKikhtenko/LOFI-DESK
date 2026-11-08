import { chromium } from 'playwright-core';

const executablePath = process.env.EDGE_PATH
  ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const url = process.env.APP_URL ?? 'http://127.0.0.1:1420/';
const output = process.env.SCREENSHOT_PATH ?? 'docs/screenshots/home.png';

const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: output, fullPage: false });
  console.log(`Screenshot saved to ${output}`);
} finally {
  await browser.close();
}

