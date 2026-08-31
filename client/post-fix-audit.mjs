import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/Prash/.gemini/antigravity/brain/14980bfb-dc05-4af4-8649-368a7b3f660f/screenshots/post_fix_audit';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const issues = [];
const consoleErrors = [];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function ss(page, name) {
  await page.screenshot({ path: path.join(DIR, name), fullPage: false });
  console.log(`  [SS] ${name}`);
}

async function runPostFixAudit() {
  console.log('=== POST-FIX VERIFICATION AUDIT ===\n');
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push({ page: page.url(), err: msg.text() }); });
  page.on('pageerror', err => consoleErrors.push({ page: page.url(), err: err.message }));

  // === 1. LOGIN PAGE (Check Demo Banner) ===
  console.log('1. LOGIN PAGE');
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle0' });
  await sleep(800);
  await ss(page, '01_login_with_demo_banner.png');
  const hasDemoBanner = await page.$eval('body', b => b.innerText.includes('DEMO') || b.innerText.includes('Evaluation') || b.innerText.includes('hackathon'));
  console.log('  Demo banner present:', hasDemoBanner);
  if (!hasDemoBanner) issues.push('LOGIN: Demo mode banner missing');

  // Check Ashoka Chakra SVG
  const chakraSpokes = await page.evaluate(() => {
    const lines = document.querySelectorAll('svg line');
    return lines.length;
  });
  console.log('  Chakra spoke lines:', chakraSpokes);
  if (chakraSpokes < 24) issues.push(`LOGIN: Ashoka Chakra has only ${chakraSpokes} spokes (expected 24)`);

  // Login as Admin
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const t = await (await btn.getProperty('textContent')).jsonValue();
    if (t.trim() === 'Admin') { await btn.click(); break; }
  }
  await sleep(2000);

  // === 2. DASHBOARD (Check breadcrumb, charts, empty state) ===
  console.log('\n2. DASHBOARD');
  await page.goto('http://127.0.0.1:3000/dashboard', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await ss(page, '02_dashboard_fixed.png');

  const hasBreadcrumb = await page.evaluate(() => {
    const nav = document.querySelector('[aria-label="breadcrumb"], .breadcrumb, nav ol');
    return !!nav;
  });
  console.log('  Breadcrumb present:', hasBreadcrumb);

  const chartBars = await page.evaluate(() => {
    return document.querySelectorAll('.recharts-bar-rectangle, .recharts-rectangle').length;
  });
  console.log('  Chart bars rendered:', chartBars);
  if (chartBars === 0) issues.push('DASHBOARD: Charts still not rendering');

  // Mobile view
  await page.setViewport({ width: 375, height: 812 });
  await sleep(500);
  const mobileScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
  console.log('  Mobile horizontal scroll:', mobileScroll);
  if (mobileScroll) issues.push('DASHBOARD: Still has mobile horizontal scroll');
  await ss(page, '02b_dashboard_mobile_fixed.png');
  await page.setViewport({ width: 1440, height: 900 });

  // === 3. 404 PAGE ===
  console.log('\n3. 404 PAGE');
  await page.goto('http://127.0.0.1:3000/this-does-not-exist', { waitUntil: 'networkidle0' });
  await sleep(800);
  await ss(page, '03_404_page_new.png');
  const is404 = await page.evaluate(() => document.body.innerText.includes('404') || document.body.innerText.includes('Not Found') || document.body.innerText.includes('Page Not Found'));
  console.log('  404 page shown:', is404);
  if (!is404) issues.push('ROUTING: 404 page not showing for unknown routes');

  // === 4. ACCESS DENIED PAGE ===
  console.log('\n4. ACCESS DENIED (Inspector tries /users)');
  // Login as Inspector first
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle0' });
  const btns = await page.$$('button');
  for (const btn of btns) {
    const t = await (await btn.getProperty('textContent')).jsonValue();
    if (t.trim() === 'Inspector') { await btn.click(); break; }
  }
  await sleep(2000);
  await page.goto('http://127.0.0.1:3000/users', { waitUntil: 'networkidle0' });
  await sleep(800);
  await ss(page, '04_access_denied_page.png');
  const isAccessDenied = await page.evaluate(() =>
    document.body.innerText.includes('Access') ||
    document.body.innerText.includes('Permission') ||
    document.body.innerText.includes('Restricted') ||
    document.body.innerText.includes('Denied')
  );
  console.log('  Access Denied page shown:', isAccessDenied);
  if (!isAccessDenied) issues.push('ROUTING: Access Denied page not showing (silent redirect still happening)');

  // Login back as Admin for further tests
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle0' });
  const adminBtns = await page.$$('button');
  for (const btn of adminBtns) {
    const t = await (await btn.getProperty('textContent')).jsonValue();
    if (t.trim() === 'Admin') { await btn.click(); break; }
  }
  await sleep(2000);

  // === 5. REPORTS HUB PAGE ===
  console.log('\n5. REPORTS HUB PAGE');
  await page.goto('http://127.0.0.1:3000/reports', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await ss(page, '05_reports_hub_new.png');
  const reportsHeading = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent : '';
  });
  console.log('  Reports page heading:', reportsHeading);
  const stillTestSessions = reportsHeading.toLowerCase().includes('test session') && !reportsHeading.toLowerCase().includes('report');
  if (stillTestSessions) issues.push('REPORTS: /reports still showing Test Sessions instead of Reports Hub');

  // === 6. PUBLIC VERIFY LANDING (no stale value) ===
  console.log('\n6. PUBLIC VERIFY LANDING');
  await page.goto('http://127.0.0.1:3000/verify', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await ss(page, '06_verify_landing_clean.png');
  const verifyInputVal = await page.evaluate(() => {
    const inp = document.querySelector('input[type="text"]');
    return inp ? inp.value : 'NOT_FOUND';
  });
  console.log('  Verify input value on landing:', verifyInputVal);
  if (verifyInputVal && verifyInputVal !== '' && verifyInputVal !== 'NOT_FOUND') {
    issues.push(`VERIFY: Input still pre-filled with "${verifyInputVal}" on fresh visit`);
  }
  const hasErrorOnLanding = await page.evaluate(() =>
    document.body.innerText.includes('Not Found') || document.body.innerText.includes('Certificate Reference Not Found')
  );
  console.log('  Error shown on clean landing:', hasErrorOnLanding);
  if (hasErrorOnLanding) issues.push('VERIFY: Error state shown on clean /verify landing (stale value still triggering)');

  // === 7. INSTRUMENTS (no change expected) ===
  console.log('\n7. INSTRUMENTS REGISTRY');
  await page.goto('http://127.0.0.1:3000/instruments', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await ss(page, '07_instruments_postfix.png');

  // === 8. TEST SESSIONS ===
  console.log('\n8. TEST SESSIONS');
  await page.goto('http://127.0.0.1:3000/tests', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await ss(page, '08_test_sessions_postfix.png');

  // === 9. USER MANAGEMENT (Admin) ===
  console.log('\n9. USER MANAGEMENT (as Admin)');
  await page.goto('http://127.0.0.1:3000/users', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await ss(page, '09_user_management_postfix.png');
  const usersHeading = await page.evaluate(() => document.querySelector('h1')?.textContent || '');
  console.log('  Users page heading:', usersHeading);

  // === 10. SETTINGS (Admin) ===
  console.log('\n10. SETTINGS');
  await page.goto('http://127.0.0.1:3000/settings', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await ss(page, '10_settings_postfix.png');

  // === 11. AUDIT TRAIL ===
  console.log('\n11. AUDIT TRAIL');
  await page.goto('http://127.0.0.1:3000/audit', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await ss(page, '11_audit_trail_postfix.png');

  // === 12. VERIFY WITH CERT ===
  console.log('\n12. PUBLIC VERIFY (with cert)');
  await page.goto('http://127.0.0.1:3000/verify/NAWI-2026-000001', { waitUntil: 'networkidle0' });
  await sleep(2000);
  await ss(page, '12_verify_with_cert.png');

  // === FINAL SUMMARY ===
  console.log('\n\n============================');
  console.log('POST-FIX AUDIT SUMMARY');
  console.log('============================');
  console.log(`Issues remaining: ${issues.length}`);
  issues.forEach((iss, i) => console.log(`  ${i + 1}. ${iss}`));
  console.log(`Console errors: ${consoleErrors.length}`);
  consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. [${e.page}] ${e.err?.substring(0, 100)}`));
  console.log('============================\n');

  await browser.close();
}

runPostFixAudit().catch(err => { console.error('AUDIT FAILED:', err.message); process.exit(1); });
