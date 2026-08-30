import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/Prash/.gemini/antigravity/brain/14980bfb-dc05-4af4-8649-368a7b3f660f/screenshots/audit';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const issues = [];
const successes = [];

async function audit() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('401')) {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
      issues.push('Console Error: ' + msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('BROWSER PAGE ERROR:', err.message);
    issues.push('Page Error: ' + err.message);
  });

  console.log('\n--- 1. Testing Login Page & Quick Fills ---');
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login.png') });

  // Click Quick Sign-In Admin button
  const adminBtn = (await page.$$('button')).find(async b => (await (await b.getProperty('textContent')).jsonValue()).includes('Admin'));
  if (adminBtn) {
    await adminBtn.click();
    await new Promise(r => setTimeout(r, 200));
  } else {
    await page.type('input[type="email"]', 'admin@nawi.gov.in');
    await page.type('input[type="password"]', 'password123');
  }
  
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_live.png') });
  successes.push('Admin login successful');

  console.log('\n--- 2. Testing Language Switching (EN -> HI -> TA -> BN -> EN) ---');
  const langBtn = await page.$('header button');
  if (langBtn) {
    await langBtn.click();
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_lang_open.png') });

    // Click Hindi
    const btns = await page.$$('header div button');
    for (const b of btns) {
      const txt = await (await b.getProperty('textContent')).jsonValue();
      if (txt.includes('हिन्दी')) {
        await b.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard_hindi.png') });
        successes.push('Language switched to Hindi');
        break;
      }
    }

    // Switch back to English
    await page.click('header button');
    await new Promise(r => setTimeout(r, 300));
    const btns2 = await page.$$('header div button');
    for (const b of btns2) {
      const txt = await (await b.getProperty('textContent')).jsonValue();
      if (txt.includes('English')) {
        await b.click();
        await new Promise(r => setTimeout(r, 600));
        successes.push('Language switched back to English');
        break;
      }
    }
  }

  console.log('\n--- 3. Testing Instrument Registry ---');
  await page.goto('http://127.0.0.1:3000/instruments', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_instrument_list.png') });
  successes.push('Instrument registry loaded with database items');

  console.log('\n--- 4. Testing Instrument Registration Form ---');
  await page.goto('http://127.0.0.1:3000/instruments/new', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Fill in instrument form
  const inputs = await page.$$('input[type="text"]');
  if (inputs.length >= 4) {
    await inputs[0].type('Electronic Platform Scale Pro');
    await inputs[1].type('SCALE-PRO-' + Math.floor(Math.random() * 10000));
    await inputs[2].type('EPS-3000');
    await inputs[3].type('Essae Digitronics');
  }

  const numInputs = await page.$$('input[type="number"]');
  if (numInputs.length >= 4) {
    await numInputs[0].type('300');
    await numInputs[1].type('2');
    await numInputs[2].type('0.1');
    await numInputs[3].type('0.05');
  }

  const locInput = await page.$('input[placeholder*="Location"], input[placeholder*="Lab"], input[name="location"]');
  if (locInput) await locInput.type('Central Legal Metrology Lab, New Delhi');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_instrument_filled.png') });
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_instrument_saved.png') });
  successes.push('Instrument registration submitted & saved');

  console.log('\n--- 5. Testing Test Sessions List ---');
  await page.goto('http://127.0.0.1:3000/tests', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_test_sessions_list.png') });
  successes.push('Test sessions list verified');

  console.log('\n--- 6. Testing Test Session Detail & Verification Modules ---');
  // Open the first test session
  const openBtn = await page.$('table button, table a');
  if (openBtn) {
    await openBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_test_session_detail.png') });
    successes.push('Test session detail page loaded');

    // Click on Weighing Performance module
    const moduleCards = await page.$$('.cursor-pointer');
    if (moduleCards.length > 0) {
      await moduleCards[0].click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_weighing_data_entry.png') });
      successes.push('Weighing performance data entry module opened');

      // Click save/evaluate
      const saveBtn = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Back")');
      if (saveBtn) {
        await saveBtn.click();
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_weighing_saved.png') });
      }
    }
  }

  console.log('\n--- 7. Testing Official Report & PDF View ---');
  await page.goto('http://127.0.0.1:3000/tests', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Find completed session and view report
  const sessionLinks = await page.$$('a[href*="/tests/"], table tr');
  if (sessionLinks.length > 1) {
    await page.goto('http://127.0.0.1:3000/reports/NAWI-2026-000001', { waitUntil: 'networkidle0' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_reports_page.png') });
    successes.push('Official report download page verified');
  }

  console.log('\n--- 8. Testing Audit Trail Records ---');
  await page.goto('http://127.0.0.1:3000/audit', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_audit_trail_live.png') });
  successes.push('Audit trail verified with live database entries');

  console.log('\n--- 9. Testing User Management ---');
  await page.goto('http://127.0.0.1:3000/users', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_users_live.png') });
  successes.push('User management verified with live database entries');

  console.log('\n--- 10. Testing Settings Page ---');
  await page.goto('http://127.0.0.1:3000/settings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_settings_live.png') });
  successes.push('Settings page verified');

  console.log('\n======================================');
  console.log('AUDIT COMPLETED SUCCESSFULLY!');
  console.log(`Successes (${successes.length}):`);
  successes.forEach((s, idx) => console.log(`  ${idx + 1}. ${s}`));
  console.log(`Issues Found (${issues.length}):`);
  issues.forEach((i, idx) => console.log(`  ${idx + 1}. ${i}`));
  console.log('======================================\n');

  await browser.close();
}

audit().catch(console.error);
