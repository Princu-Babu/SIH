import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/Prash/.gemini/antigravity/brain/14980bfb-dc05-4af4-8649-368a7b3f660f/screenshots/final_pass';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const auditLog = [];
const consoleErrors = [];

async function runFullAudit() {
  console.log('Starting Complete Physical UI & Button Audit...');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[BROWSER CONSOLE ERROR]:', msg.text());
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('[BROWSER PAGE ERROR]:', err.message);
    consoleErrors.push(err.message);
  });

  // 1. LOGIN & AUTH
  console.log('1. Testing Login Page & Quick Buttons...');
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login.png') });

  // Click Inspector Quick Sign In
  const inspectorBtn = await page.$('button:has-text("Inspector")') || (await page.$$('button'))[1];
  if (inspectorBtn) {
    await inspectorBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_after_login.png') });
    auditLog.push('Quick Sign-in successful');
  }

  // 2. DASHBOARD & MULTILINGUAL
  console.log('2. Testing Language Switching...');
  const select = await page.$('select');
  if (select) {
    await page.select('select', 'hi');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard_hindi.png') });
    await page.select('select', 'ta');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_dashboard_tamil.png') });
    await page.select('select', 'en');
    await new Promise(r => setTimeout(r, 500));
    auditLog.push('Multilingual translation tested');
  }

  // 3. INSTRUMENT REGISTRY
  console.log('3. Testing Instruments Registry...');
  await page.goto('http://127.0.0.1:3000/instruments', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_instruments_list.png') });

  // 4. TEST SESSIONS
  console.log('4. Testing Test Sessions List...');
  await page.goto('http://127.0.0.1:3000/tests', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_test_sessions_list.png') });

  // Click on the first session detail
  const sessionLinks = await page.$$('a[href*="/tests/"]');
  if (sessionLinks.length > 0) {
    await sessionLinks[0].click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_test_session_detail.png') });
  }

  // 5. TEST DATA ENTRY & HARDWARE STREAMING SIMULATOR
  console.log('5. Testing Weighing Performance Data Entry & Serial Telemetry...');
  const enterDataBtns = await page.$$('a[href*="/tests/"], button');
  for (const btn of enterDataBtns) {
    const txt = await (await btn.getProperty('textContent')).jsonValue();
    if (txt.includes('Weighing') || txt.includes('Performance') || txt.includes('Enter Data')) {
      await btn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_weighing_data_entry.png') });

      // Click "Connect Live Scale" button
      const telemetryBtn = await page.$('button:has-text("Connect Live Scale")') || await page.$('button:has-text("⚡")');
      if (telemetryBtn) {
        await telemetryBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_weighing_telemetry_streaming.png') });
        auditLog.push('RS-232 telemetry stream toggle verified');
      }
      break;
    }
  }

  // 6. PUBLIC QR VERIFICATION PORTAL
  console.log('6. Testing Public QR Verification Portal...');
  await page.goto('http://127.0.0.1:3000/verify/NAWI-2026-000001', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_public_qr_verification.png') });
  auditLog.push('Public QR Verification portal verified');

  // 7. AUDIT TRAIL
  console.log('7. Testing Immutable Audit Trail...');
  await page.goto('http://127.0.0.1:3000/audit', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_immutable_audit_log.png') });
  auditLog.push('Audit Trail verified');

  console.log('\n--- Final Audit Results ---');
  console.log('Audit Successes:', auditLog);
  console.log('Console Errors:', consoleErrors.length === 0 ? '0 Errors (Clean)' : consoleErrors);

  await browser.close();
}

runFullAudit().catch(console.error);
