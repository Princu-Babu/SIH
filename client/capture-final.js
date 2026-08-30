import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/Prash/.gemini/antigravity/brain/14980bfb-dc05-4af4-8649-368a7b3f660f/screenshots/final';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureAll() {
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

  console.log('2. One-click Quick Officer Sign-In as Admin...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.trim() === 'Admin') {
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  console.log('3. Capturing Live Executive Dashboard...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_live.png') });

  console.log('4. Capturing Instrument Registry...');
  await page.goto('http://127.0.0.1:3000/instruments', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_instruments_registry.png') });

  console.log('5. Capturing Instrument Detail Page...');
  const rowBtn = await page.$('table button, table a');
  if (rowBtn) {
    await rowBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_instrument_details.png') });
  }

  console.log('6. Capturing Test Sessions List...');
  await page.goto('http://127.0.0.1:3000/tests', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_test_sessions_list.png') });

  console.log('7. Capturing Test Session Detail Hub (6-modules)...');
  const sessionRow = await page.$('table button, table a');
  if (sessionRow) {
    await sessionRow.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_test_session_hub.png') });

    // Open Weighing Performance Module
    const moduleCard = await page.$('.cursor-pointer');
    if (moduleCard) {
      await moduleCard.click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_weighing_performance_calibration.png') });
    }
  }

  console.log('8. Capturing Reports & Certificate Downloads...');
  await page.goto('http://127.0.0.1:3000/reports/NAWI-2026-000001', { waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_reports_and_certificates.png') });

  console.log('9. Capturing Immutable Audit Trail...');
  await page.goto('http://127.0.0.1:3000/audit', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_audit_trail_immutable.png') });

  console.log('10. Capturing User Management...');
  await page.goto('http://127.0.0.1:3000/users', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_user_management.png') });

  console.log('11. Capturing System Settings & OIML Standards...');
  await page.goto('http://127.0.0.1:3000/settings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_settings_standards.png') });

  console.log('12. Capturing Multilingual Dashboard in Hindi...');
  await page.goto('http://127.0.0.1:3000/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click Hindi in language dropdown
  const topLangBtn = await page.$('header div[class*="relative"] button');
  if (topLangBtn) {
    await topLangBtn.click();
    await new Promise(r => setTimeout(r, 300));
    const langOptions = await page.$$('header div[class*="relative"] div button');
    for (const opt of langOptions) {
      const txt = await (await opt.getProperty('textContent')).jsonValue();
      if (txt.includes('हिन्दी')) {
        await opt.click();
        await new Promise(r => setTimeout(r, 800));
        break;
      }
    }
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_hindi_multilingual_dashboard.png') });

  console.log('\nAll 12 high-resolution screenshots generated successfully in screenshots/final!');
  await browser.close();
}

captureAll().catch(console.error);
