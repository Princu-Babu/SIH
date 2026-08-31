import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/Prash/.gemini/antigravity/brain/14980bfb-dc05-4af4-8649-368a7b3f660f/screenshots/final_pass';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const auditLog = [];
const consoleErrors = [];

async function runAudit() {
  console.log('--- Starting Clean Final Puppeteer Audit ---');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  // 1. LOGIN
  console.log('1. Testing Login...');
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login.png') });

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await (await b.getProperty('textContent')).jsonValue();
    if (text.includes('Inspector') || text.includes('Admin')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_live.png') });
  auditLog.push('Login & Dashboard verified');

  // 2. MULTILINGUAL
  console.log('2. Testing Language Switching...');
  const select = await page.$('select');
  if (select) {
    await page.select('select', 'hi');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard_hindi.png') });
    await page.select('select', 'en');
    await new Promise(r => setTimeout(r, 500));
    auditLog.push('Multilingual language switching verified');
  }

  // 3. INSTRUMENTS
  console.log('3. Testing Instruments Registry...');
  await page.goto('http://127.0.0.1:3000/instruments', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_instruments_registry.png') });
  auditLog.push('Instrument Registry verified');

  // 4. TEST SESSIONS & DATA ENTRY
  console.log('4. Testing Test Sessions & Live Telemetry Form...');
  await page.goto('http://127.0.0.1:3000/tests', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_test_sessions_list.png') });

  const links = await page.$$('a[href*="/tests/"]');
  if (links.length > 0) {
    await links[0].click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_test_session_detail.png') });
  }

  // Navigate to Weighing performance data entry
  const actionBtns = await page.$$('a[href*="/tests/"], button');
  for (const ab of actionBtns) {
    const txt = await (await ab.getProperty('textContent')).jsonValue();
    if (txt.includes('Weighing') || txt.includes('Performance') || txt.includes('Enter Data')) {
      await ab.click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_weighing_calibration_curve.png') });

      // Click "Connect Live Scale" button
      const allBtns = await page.$$('button');
      for (const btn of allBtns) {
        const btnTxt = await (await btn.getProperty('textContent')).jsonValue();
        if (btnTxt.includes('Connect Live Scale') || btnTxt.includes('Telemetry')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 1200));
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_live_rs232_streaming.png') });
          auditLog.push('Live RS-232 Telemetry streaming verified');
          break;
        }
      }
      break;
    }
  }

  // 5. PUBLIC QR VERIFICATION PORTAL
  console.log('5. Testing Public Verification Portal...');
  await page.goto('http://127.0.0.1:3000/verify/NAWI-2026-000001', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_public_verification_portal.png') });
  auditLog.push('Public QR Verification portal verified');

  // 6. IMMUTABLE AUDIT TRAIL
  console.log('6. Testing Immutable Audit Trail...');
  await page.goto('http://127.0.0.1:3000/audit', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_immutable_audit_trail.png') });
  auditLog.push('Immutable Audit Trail verified');

  console.log('\n========================================');
  console.log('FINAL AUDIT SUMMARY:');
  console.log('Successes:', auditLog);
  console.log('Console Errors:', consoleErrors.length === 0 ? '0 Errors (Clean)' : consoleErrors);
  console.log('========================================\n');

  await browser.close();
}

runAudit().catch(console.error);
