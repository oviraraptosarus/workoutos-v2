/**
 * Workout OS – Full Site QA Audit (CommonJS)
 * Run: node tests/full-audit.cjs
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:4028';
const SCREENSHOTS = path.join(__dirname, 'audit-screenshots');
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });

const RESULTS = { passed: [], failed: [], warnings: [], consoleErrors: {}, screenshots: [] };

function pass(msg) { console.log('  [PASS]', msg); RESULTS.passed.push(msg); }
function fail(msg) { console.error('  [FAIL]', msg); RESULTS.failed.push(msg); }
function warn(msg) { console.warn('  [WARN]', msg); RESULTS.warnings.push(msg); }

async function shot(page, name) {
  const file = path.join(SCREENSHOTS, name + '.png');
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  RESULTS.screenshots.push(file);
  console.log('  [SHOT]', name + '.png');
}

async function checkBadText(page, label) {
  const body = await page.textContent('body').catch(() => '');
  for (const bad of ['NaN', '[object Object]', 'undefined', 'null']) {
    if (new RegExp(`\\b${bad}\\b`).test(body)) {
      warn('[' + label + '] Found "' + bad + '" in page text');
    }
  }
}

async function clickIfVisible(page, sel, label) {
  try {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 })) {
      await el.click({ timeout: 3000 });
      pass('Clicked: ' + label);
      return true;
    }
    warn('Not visible: ' + label);
    return false;
  } catch (e) {
    fail('Cannot click: ' + label + ' — ' + e.message.split('\n')[0]);
    return false;
  }
}

async function auditPage(page, route, label, id) {
  console.log('\n--- ' + label.toUpperCase() + ' ---');
  const errs = [];
  const handler = msg => { if (msg.type() === 'error') errs.push(msg.text()); };
  page.on('console', handler);
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {
    warn(`Failed to goto ${route}: ${e.message}`);
  });
  await page.waitForTimeout(2500);
  const cur = page.url();
  if (cur.includes('sign-up') || cur.includes('welcome')) {
    warn(label + ' requires auth → ' + cur);
    page.off('console', handler);
    RESULTS.consoleErrors[label] = errs;
    return false;
  }
  await shot(page, id + '-top');
  await checkBadText(page, label);
  await page.evaluate(() => window.scrollBy(0, window.innerHeight)).catch(()=> { });
  await page.waitForTimeout(400);
  await shot(page, id + '-scroll');
  const brokenImgs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)
  ).catch(() => []);
  if (brokenImgs.length) warn('[' + label + '] Broken imgs: ' + brokenImgs.slice(0,2).join(', '));
  else pass('[' + label + '] No broken images');
  page.off('console', handler);
  RESULTS.consoleErrors[label] = errs;
  return true;
}

async function main() {
  console.log('WORKOUT OS FULL SITE AUDIT');
  console.log('===========================');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  console.log('\n--- ROOT ---');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, '01-root');
  const rootUrl = page.url();
  console.log('  Redirected to:', rootUrl);
  if (rootUrl !== BASE + '/') pass('Root redirects to: ' + rootUrl);

  console.log('\n--- LOGIN PAGE ---');
  if (!page.url().includes('sign-up')) {
    await page.goto(BASE + '/sign-up-login-screen', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
  }
  await shot(page, '02-login');
  const hasEmail = await page.locator('input[type=email]').isVisible({ timeout: 2000 }).catch(() => false);
  const hasPwd = await page.locator('input[type=password]').isVisible({ timeout: 2000 }).catch(() => false);
  const hasGoogle = await page.locator('button:has-text("Google"), button:has-text("google")').isVisible({ timeout: 2000 }).catch(() => false);
  if (hasEmail) pass('Email input present');
  if (hasPwd) pass('Password input present');
  if (hasGoogle) pass('Google sign-in button present');

  console.log('\n--- DASHBOARD ---');
  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  const dashUrl = page.url();
  if (dashUrl.includes('sign-up') || dashUrl.includes('welcome')) {
    warn('Dashboard requires auth. All protected pages will be skipped.');
  } else {
    await shot(page, '03-dashboard-top');
    await checkBadText(page, 'dashboard');
    for (const card of ['Nutrition', 'Workout', 'Sleep', 'Water', 'Mood']) {
      const vis = await page.locator('text=' + card).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (vis) pass('Card visible: ' + card); else warn('Card not found: ' + card);
    }
    const logMeal = await page.locator('button:has-text("Log meal")').isVisible({ timeout: 2000 }).catch(() => false);
    if (logMeal) {
      await page.locator('button:has-text("Log meal")').click();
      await page.waitForTimeout(500);
      const formVisible = await page.locator('input[placeholder*="Meal"], input[placeholder*="meal"]').isVisible({ timeout: 2000 }).catch(() => false);
      if (formVisible) pass('Log meal form appears'); else warn('Log meal form not found after click');
      await clickIfVisible(page, 'button:has-text("Cancel")', 'Cancel log meal');
    }
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(400);
    await shot(page, '03b-dashboard-mid');
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(400);
    await shot(page, '03c-dashboard-bottom');

    const customizeBtn = await page.locator('button:has-text("Customize")').isVisible({ timeout: 2000 }).catch(() => false);
    if (customizeBtn) {
      await page.locator('button:has-text("Customize")').click();
      await page.waitForTimeout(500);
      await shot(page, '03d-dashboard-customize-modal');
      pass('Customize Dashboard modal opens');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    const navLinks = await page.locator('nav a[href], footer a[href]').all();
    console.log('  Nav links found:', navLinks.length);
    for (const lnk of navLinks) {
      const href = await lnk.getAttribute('href').catch(() => '');
      const txt = (await lnk.textContent().catch(() => '')).trim();
      if (href) pass('Nav link: "' + (txt || href) + '" → ' + href);
    }
  }

  const pages = [
    ['/diet', 'Diet', '04-diet'],
    ['/workout', 'Workout', '05-workout'],
    ['/sleep', 'Sleep', '06-sleep'],
    ['/water', 'Water', '07-water'],
    ['/progress', 'Progress', '08-progress'],
    ['/budget-tracker', 'Budget Tracker', '09-budget'],
    ['/planner', 'Planner', '10-planner'],
    ['/countdowns', 'Countdowns', '11-countdowns'],
    ['/profile', 'Profile', '12-profile'],
    ['/settings', 'Settings', '13-settings'],
    ['/vault', 'Vault', '14-vault'],
  ];

  for (const [route, label, id] of pages) {
    const ok = await auditPage(page, route, label, id);
    if (ok) {
      if (label === 'Diet') {
        await clickIfVisible(page, 'button:has-text("Add"), button[aria-label*="Add"]', '[Diet] Add button');
        await page.waitForTimeout(400);
        await shot(page, id + '-modal');
        await page.keyboard.press('Escape');
      }
      if (label === 'Sleep') {
        await clickIfVisible(page, 'button:has-text("Log"), button:has-text("Add Sleep"), button:has-text("Log Sleep")', '[Sleep] Log button');
        await page.waitForTimeout(400);
        await shot(page, id + '-modal');
        await page.keyboard.press('Escape');
      }
      if (label === 'Budget Tracker') {
        await clickIfVisible(page, 'button:has-text("Add"), button:has-text("Expense"), button:has-text("+")', '[Budget] Add button');
        await page.waitForTimeout(400);
        await shot(page, id + '-modal');
        await page.keyboard.press('Escape');
      }
      if (label === 'Countdowns') {
        await clickIfVisible(page, 'button:has-text("Add"), button:has-text("+")', '[Countdowns] Add button');
        await page.waitForTimeout(400);
        await shot(page, id + '-modal');
        await page.keyboard.press('Escape');
      }
    }
  }

  await browser.close();

  console.log('\n\nAUDIT REPORT');
  console.log('=============');
  console.log('PASSED (' + RESULTS.passed.length + '):');
  RESULTS.passed.forEach(p => console.log('  [OK] ' + p));
  console.log('\nFAILED (' + RESULTS.failed.length + '):');
  RESULTS.failed.forEach(f => console.log('  [!!] ' + f));
  console.log('\nWARNINGS (' + RESULTS.warnings.length + '):');
  RESULTS.warnings.forEach(w => console.log('  [WW] ' + w));
  console.log('\nCONSOLE ERRORS:');
  for (const [pg, errs] of Object.entries(RESULTS.consoleErrors)) {
    if (errs.length) {
      console.log('  [' + pg + ']: ' + errs.length + ' error(s)');
      errs.slice(0,3).forEach(e => console.log('    > ' + e.substring(0, 150)));
    }
  }
  const rpt = path.join(__dirname, 'audit-report.json');
  fs.writeFileSync(rpt, JSON.stringify(RESULTS, null, 2));
  console.log('\nReport: ' + rpt);
  console.log('Screenshots: ' + SCREENSHOTS);
  process.exit(RESULTS.failed.length > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
