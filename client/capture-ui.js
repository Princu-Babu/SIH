import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/Prash/.gemini/antigravity/brain/14980bfb-dc05-4af4-8649-368a7b3f660f/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Capturing Login Page...');
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png') });

  console.log('2. Logging in as Admin...');
  // Click quick-fill button for admin if exists, or type in inputs
  await page.type('input[type="email"]', 'admin@nawi.gov.in');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  console.log('3. Capturing Dashboard...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard.png') });

  console.log('4. Capturing Instrument List...');
  await page.goto('http://127.0.0.1:3000/instruments', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_instruments_list.png') });

  console.log('5. Capturing New Instrument Form...');
  await page.goto('http://127.0.0.1:3000/instruments/new', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_new_instrument_form.png') });

  console.log('6. Capturing Test Sessions List...');
  await page.goto('http://127.0.0.1:3000/tests', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_test_sessions_list.png') });

  console.log('7. Capturing Audit Log...');
  await page.goto('http://127.0.0.1:3000/audit', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_audit_log.png') });

  console.log('8. Capturing User Management...');
  await page.goto('http://127.0.0.1:3000/users', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_user_management.png') });

  console.log('9. Capturing Settings / Standards...');
  await page.goto('http://127.0.0.1:3000/settings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_settings.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch(console.error);
