import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/Prash/.gemini/antigravity/brain/14980bfb-dc05-4af4-8649-368a7b3f660f/screenshots/boss_audit';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const issues = [];
const consoleErrors = [];

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(DIR, name), fullPage: true });
  console.log(`  [SCREENSHOT] ${name}`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function collectAllText(page) {
  return page.evaluate(() => document.body?.innerText || '');
}

async function getAllButtons(page) {
  return page.evaluate(() => {
    const btns = [...document.querySelectorAll('button, a[role="button"], [type="submit"], [type="button"]')];
    return btns.map((b, i) => ({
      index: i,
      text: b.textContent?.trim()?.substring(0, 80),
      disabled: b.disabled,
      visible: b.offsetParent !== null,
      tag: b.tagName,
      href: b.href || null,
      classes: b.className?.substring(0, 120)
    }));
  });
}

async function getAllLinks(page) {
  return page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href]')];
    return links.map(l => ({
      text: l.textContent?.trim()?.substring(0, 60),
      href: l.getAttribute('href'),
      visible: l.offsetParent !== null
    }));
  });
}

async function getAllInputs(page) {
  return page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input, textarea, select')];
    return inputs.map(inp => ({
      type: inp.type,
      name: inp.name,
      placeholder: inp.placeholder,
      value: inp.value,
      disabled: inp.disabled,
      required: inp.required,
      label: inp.labels?.[0]?.textContent?.trim() || null,
      tag: inp.tagName
    }));
  });
}

async function checkAccessibility(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    const missingAlt = imgs.filter(img => !img.alt).map(img => img.src?.substring(0, 80));
    
    const buttons = [...document.querySelectorAll('button')];
    const emptyButtons = buttons.filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label')).length;
    
    const inputs = [...document.querySelectorAll('input')];
    const unlabeled = inputs.filter(inp => !inp.labels?.length && !inp.getAttribute('aria-label') && !inp.placeholder).length;
    
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => ({
      level: h.tagName,
      text: h.textContent?.trim()?.substring(0, 60)
    }));
    
    return { missingAlt, emptyButtons, unlabeled, headings };
  });
}

async function checkLayoutIssues(page) {
  return page.evaluate(() => {
    const body = document.body;
    const hasHorizontalScroll = body.scrollWidth > window.innerWidth;
    
    // Check for overlapping elements
    const allElements = [...document.querySelectorAll('*')];
    const overflowing = allElements.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.right > window.innerWidth + 5 || rect.left < -5;
    }).length;
    
    // Check for empty containers
    const emptyDivs = [...document.querySelectorAll('div, section, main')].filter(d => {
      return d.children.length === 0 && !d.textContent?.trim() && d.offsetHeight > 20;
    }).length;
    
    // Check for broken images
    const brokenImages = [...document.querySelectorAll('img')].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src?.substring(0, 80));
    
    return { hasHorizontalScroll, overflowing, emptyDivs, brokenImages };
  });
}

async function checkColorContrast(page) {
  return page.evaluate(() => {
    // Check for text that might have poor contrast
    const textElements = [...document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label, td, th')];
    const smallText = textElements.filter(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      return fontSize < 12 && el.textContent?.trim();
    }).map(el => ({ text: el.textContent?.trim()?.substring(0, 40), fontSize: window.getComputedStyle(el).fontSize }));
    
    return { smallText };
  });
}

async function checkResponsiveness(page, pageName) {
  // Mobile viewport
  await page.setViewport({ width: 375, height: 812 });
  await sleep(500);
  await screenshot(page, `mobile_${pageName}`);
  const mobileLayout = await checkLayoutIssues(page);
  
  // Tablet viewport
  await page.setViewport({ width: 768, height: 1024 });
  await sleep(500);
  await screenshot(page, `tablet_${pageName}`);
  
  // Reset to desktop
  await page.setViewport({ width: 1440, height: 900 });
  await sleep(500);
  
  return mobileLayout;
}

async function runBossAudit() {
  console.log('=== SIH FINAL BOSS AUDIT - ZERO MERCY MODE ===\n');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ page: page.url(), error: msg.text() });
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push({ page: page.url(), error: err.message });
  });

  // ==========================================
  // PHASE 1: LOGIN PAGE
  // ==========================================
  console.log('--- PHASE 1: LOGIN PAGE ---');
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await screenshot(page, '01_login_desktop.png');
  
  const loginButtons = await getAllButtons(page);
  console.log('  Login buttons found:', loginButtons.length);
  console.log('  Button details:', JSON.stringify(loginButtons, null, 2));
  
  const loginInputs = await getAllInputs(page);
  console.log('  Login inputs found:', loginInputs.length);
  console.log('  Input details:', JSON.stringify(loginInputs, null, 2));
  
  const loginA11y = await checkAccessibility(page);
  console.log('  Accessibility:', JSON.stringify(loginA11y, null, 2));
  
  const loginLayout = await checkLayoutIssues(page);
  console.log('  Layout issues:', JSON.stringify(loginLayout, null, 2));
  
  // Test mobile responsiveness of login
  const loginMobile = await checkResponsiveness(page, '01_login.png');
  if (loginMobile.hasHorizontalScroll) issues.push('LOGIN: Horizontal scroll on mobile');
  
  // Try clicking quick sign-in buttons
  console.log('  Testing Quick Sign-In buttons...');
  const quickBtns = await page.$$('button');
  let loggedIn = false;
  for (const btn of quickBtns) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.includes('Inspector') || text.includes('Quick') || text.includes('Demo')) {
      console.log(`  Clicking: "${text.trim().substring(0, 50)}"`);
      await btn.click();
      await sleep(2000);
      loggedIn = true;
      break;
    }
  }
  
  if (!loggedIn) {
    // Try the first non-login button
    if (quickBtns.length > 1) {
      const text = await (await quickBtns[1].getProperty('textContent')).jsonValue();
      console.log(`  Fallback click: "${text.trim().substring(0, 50)}"`);
      await quickBtns[1].click();
      await sleep(2000);
      loggedIn = true;
    }
  }

  const currentUrl = page.url();
  console.log(`  After login, URL: ${currentUrl}`);
  
  // ==========================================
  // PHASE 2: DASHBOARD
  // ==========================================
  console.log('\n--- PHASE 2: DASHBOARD ---');
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '02_dashboard_desktop.png');
  
  const dashboardText = await collectAllText(page);
  const dashButtons = await getAllButtons(page);
  const dashLinks = await getAllLinks(page);
  const dashA11y = await checkAccessibility(page);
  const dashLayout = await checkLayoutIssues(page);
  const dashContrast = await checkColorContrast(page);
  
  console.log('  Dashboard headings:', JSON.stringify(dashA11y.headings, null, 2));
  console.log('  Layout issues:', JSON.stringify(dashLayout, null, 2));
  console.log('  Buttons:', dashButtons.length);
  console.log('  Links:', dashLinks.length);
  console.log('  Small text elements:', dashContrast.smallText.length);
  if (dashContrast.smallText.length > 0) {
    console.log('  Small text details:', JSON.stringify(dashContrast.smallText.slice(0, 5), null, 2));
    issues.push(`DASHBOARD: ${dashContrast.smallText.length} elements with text smaller than 12px`);
  }
  
  // Test responsive dashboard
  const dashMobile = await checkResponsiveness(page, '02_dashboard.png');
  if (dashMobile.hasHorizontalScroll) issues.push('DASHBOARD: Horizontal scroll on mobile');
  
  // Check sidebar navigation items
  const sidebarLinks = await page.evaluate(() => {
    const nav = document.querySelector('nav, aside, [class*="sidebar"], [class*="Sidebar"]');
    if (!nav) return [];
    return [...nav.querySelectorAll('a')].map(a => ({
      text: a.textContent?.trim()?.substring(0, 40),
      href: a.getAttribute('href'),
      active: a.classList.contains('active') || a.getAttribute('aria-current') === 'page'
    }));
  });
  console.log('  Sidebar/Nav links:', JSON.stringify(sidebarLinks, null, 2));

  // ==========================================
  // PHASE 3: INSTRUMENTS PAGE
  // ==========================================
  console.log('\n--- PHASE 3: INSTRUMENTS REGISTRY ---');
  await page.goto('http://127.0.0.1:3000/instruments', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '03_instruments_desktop.png');
  
  const instrButtons = await getAllButtons(page);
  const instrInputs = await getAllInputs(page);
  const instrA11y = await checkAccessibility(page);
  const instrLayout = await checkLayoutIssues(page);
  
  console.log('  Buttons:', instrButtons.length, JSON.stringify(instrButtons.map(b => b.text), null, 2));
  console.log('  Inputs:', instrInputs.length);
  console.log('  Layout:', JSON.stringify(instrLayout, null, 2));
  console.log('  Headings:', JSON.stringify(instrA11y.headings, null, 2));
  
  // Try clicking "Register New" or "Add" button
  for (const btn of instrButtons) {
    if (btn.text && (btn.text.includes('Register') || btn.text.includes('Add') || btn.text.includes('New') || btn.text.includes('+'))) {
      console.log(`  Clicking: "${btn.text}"`);
      const elements = await page.$$('button');
      for (const el of elements) {
        const t = await (await el.getProperty('textContent')).jsonValue();
        if (t.trim() === btn.text) {
          await el.click();
          await sleep(1500);
          await screenshot(page, '03b_instrument_add_modal.png');
          
          // Check modal/form inputs
          const modalInputs = await getAllInputs(page);
          console.log('  Modal/Form inputs:', JSON.stringify(modalInputs, null, 2));
          
          // Close modal if open
          const closeBtn = await page.$('[class*="close"], [aria-label="Close"], button[class*="close"]');
          if (closeBtn) await closeBtn.click();
          await sleep(500);
          break;
        }
      }
      break;
    }
  }
  
  await checkResponsiveness(page, '03_instruments.png');

  // ==========================================
  // PHASE 4: TEST SESSIONS LIST
  // ==========================================
  console.log('\n--- PHASE 4: TEST SESSIONS ---');
  await page.goto('http://127.0.0.1:3000/tests', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '04_tests_list_desktop.png');
  
  const testsButtons = await getAllButtons(page);
  const testsLinks = await getAllLinks(page);
  const testsLayout = await checkLayoutIssues(page);
  const testsA11y = await checkAccessibility(page);
  
  console.log('  Buttons:', JSON.stringify(testsButtons.map(b => b.text), null, 2));
  console.log('  Links:', JSON.stringify(testsLinks.filter(l => l.href?.includes('/tests/')), null, 2));
  console.log('  Layout:', JSON.stringify(testsLayout, null, 2));
  
  await checkResponsiveness(page, '04_tests_list.png');
  
  // Click into a test session if available
  const testSessionLinks = testsLinks.filter(l => l.href && l.href.match(/\/tests\/[a-z0-9-]+$/i));
  if (testSessionLinks.length > 0) {
    console.log('  Navigating to first test session...');
    await page.click(`a[href="${testSessionLinks[0].href}"]`);
    await sleep(2000);
    await screenshot(page, '04b_test_session_detail.png');
    
    const detailButtons = await getAllButtons(page);
    const detailLayout = await checkLayoutIssues(page);
    console.log('  Session detail buttons:', JSON.stringify(detailButtons.map(b => b.text), null, 2));
    console.log('  Session detail layout:', JSON.stringify(detailLayout, null, 2));
    
    await checkResponsiveness(page, '04b_test_detail.png');
  }

  // ==========================================
  // PHASE 5: REPORTS PAGE
  // ==========================================
  console.log('\n--- PHASE 5: REPORTS ---');
  await page.goto('http://127.0.0.1:3000/reports', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '05_reports_desktop.png');
  
  const reportsLayout = await checkLayoutIssues(page);
  const reportsButtons = await getAllButtons(page);
  const reportsA11y = await checkAccessibility(page);
  console.log('  Layout:', JSON.stringify(reportsLayout, null, 2));
  console.log('  Buttons:', JSON.stringify(reportsButtons.map(b => b.text), null, 2));
  console.log('  Headings:', JSON.stringify(reportsA11y.headings, null, 2));
  
  await checkResponsiveness(page, '05_reports.png');

  // ==========================================
  // PHASE 6: AUDIT TRAIL
  // ==========================================
  console.log('\n--- PHASE 6: AUDIT TRAIL ---');
  await page.goto('http://127.0.0.1:3000/audit', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '06_audit_trail_desktop.png');
  
  const auditLayout = await checkLayoutIssues(page);
  const auditA11y = await checkAccessibility(page);
  console.log('  Layout:', JSON.stringify(auditLayout, null, 2));
  console.log('  Headings:', JSON.stringify(auditA11y.headings, null, 2));
  
  await checkResponsiveness(page, '06_audit.png');

  // ==========================================
  // PHASE 7: USER MANAGEMENT
  // ==========================================
  console.log('\n--- PHASE 7: USER MANAGEMENT ---');
  await page.goto('http://127.0.0.1:3000/users', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '07_users_desktop.png');
  
  const usersLayout = await checkLayoutIssues(page);
  const usersButtons = await getAllButtons(page);
  console.log('  Layout:', JSON.stringify(usersLayout, null, 2));
  console.log('  Buttons:', JSON.stringify(usersButtons.map(b => b.text), null, 2));
  
  await checkResponsiveness(page, '07_users.png');

  // ==========================================
  // PHASE 8: SETTINGS
  // ==========================================
  console.log('\n--- PHASE 8: SETTINGS ---');
  await page.goto('http://127.0.0.1:3000/settings', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '08_settings_desktop.png');
  
  const settingsLayout = await checkLayoutIssues(page);
  const settingsInputs = await getAllInputs(page);
  const settingsButtons = await getAllButtons(page);
  console.log('  Layout:', JSON.stringify(settingsLayout, null, 2));
  console.log('  Inputs:', JSON.stringify(settingsInputs, null, 2));
  console.log('  Buttons:', JSON.stringify(settingsButtons.map(b => b.text), null, 2));
  
  await checkResponsiveness(page, '08_settings.png');

  // ==========================================
  // PHASE 9: PUBLIC VERIFICATION PORTAL
  // ==========================================
  console.log('\n--- PHASE 9: PUBLIC VERIFICATION PORTAL ---');
  await page.goto('http://127.0.0.1:3000/verify', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '09_verify_landing_desktop.png');
  
  const verifyLayout = await checkLayoutIssues(page);
  const verifyA11y = await checkAccessibility(page);
  const verifyInputs = await getAllInputs(page);
  const verifyButtons = await getAllButtons(page);
  console.log('  Layout:', JSON.stringify(verifyLayout, null, 2));
  console.log('  Inputs:', JSON.stringify(verifyInputs, null, 2));
  console.log('  Buttons:', JSON.stringify(verifyButtons.map(b => b.text), null, 2));
  
  // Test with a certificate number
  await page.goto('http://127.0.0.1:3000/verify/NAWI-2026-000001', { waitUntil: 'networkidle0' });
  await sleep(1500);
  await screenshot(page, '09b_verify_result_desktop.png');
  
  await checkResponsiveness(page, '09_verify.png');

  // ==========================================
  // PHASE 10: 404 PAGE
  // ==========================================
  console.log('\n--- PHASE 10: 404 / UNKNOWN ROUTE ---');
  await page.goto('http://127.0.0.1:3000/nonexistent-route', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await screenshot(page, '10_404_page.png');
  const fourOhFourText = await collectAllText(page);
  console.log('  404 page text:', fourOhFourText.substring(0, 200));

  // ==========================================
  // PHASE 11: CROSS-CUTTING CONCERNS
  // ==========================================
  console.log('\n--- PHASE 11: CROSS-CUTTING CONCERNS ---');
  
  // Check all navigation consistency
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
  await sleep(500);
  
  // Check for favicon
  const favicon = await page.evaluate(() => {
    const link = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    return link ? link.href : 'MISSING';
  });
  console.log('  Favicon:', favicon);
  if (favicon === 'MISSING') issues.push('GLOBAL: No favicon set');
  
  // Check page title
  const title = await page.title();
  console.log('  Page title:', title);
  if (!title || title === 'Vite + React') issues.push(`GLOBAL: Generic page title "${title}" - should be branded`);
  
  // Check for loading states
  const hasLoadingSpinner = await page.evaluate(() => {
    return !!document.querySelector('[class*="loading"], [class*="spinner"], [class*="Loading"], [class*="Spinner"]');
  });
  console.log('  Has loading spinner component:', hasLoadingSpinner);
  
  // Check for error boundaries
  const hasErrorBoundary = await page.evaluate(() => {
    return !!document.querySelector('[class*="error"], [class*="Error"]');
  });
  console.log('  Has error boundary:', hasErrorBoundary);

  // ==========================================
  // FINAL SUMMARY
  // ==========================================
  console.log('\n\n=========================================');
  console.log('=== SIH FINAL BOSS AUDIT SUMMARY ===');
  console.log('=========================================');
  console.log('\nISSUES FOUND:');
  issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  console.log(`\nCONSOLE ERRORS: ${consoleErrors.length}`);
  consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. [${err.page}] ${err.error?.substring(0, 150)}`));
  console.log('\nTotal screenshots captured in:', DIR);
  console.log('=========================================');
  
  await browser.close();
}

runBossAudit().catch(err => {
  console.error('AUDIT FAILED:', err.message);
  process.exit(1);
});
