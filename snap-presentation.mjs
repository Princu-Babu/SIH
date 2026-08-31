import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
const DIR = 'C:/Users/Prash/.gemini/antigravity/brain/14980bfb-dc05-4af4-8649-368a7b3f660f/screenshots/presentation';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto('file:///d:/sih/presentation/index.html', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: path.join(DIR, '01_slide_1_title.png'), fullPage: false });
// Scroll to see more slides
await page.evaluate(() => window.scrollTo(0, 900));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: path.join(DIR, '02_slide_2_problem.png'), fullPage: false });
await page.evaluate(() => window.scrollTo(0, 1800));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: path.join(DIR, '03_slide_3_solution.png'), fullPage: false });
await page.evaluate(() => window.scrollTo(0, 2700));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: path.join(DIR, '04_slide_4_architecture.png'), fullPage: false });
// Full page screenshot
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: path.join(DIR, '00_full_deck.png'), fullPage: true });
console.log('Presentation screenshots captured');
await browser.close();
