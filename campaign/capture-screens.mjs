// Capture the real tapfour screens from a local platform (cd platform && npm run db:init && npx wrangler dev).
// Saves HTML snapshots (real markup + the dashboard's own CSS, inlined) for animation on stage, plus 3× PNGs.
//   node capture-screens.mjs [http://127.0.0.1:8787]
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = new URL('./screens/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['guest-menu', '/menu/kape-norte'],
  ['guest-links', '/p/kape-norte'],
  ['owner-home', '/app'],
  ['owner-menu', '/app/menu'],
  ['owner-links', '/app/destinations'],
  ['owner-stands', '/app/stands'],
  ['owner-billing', '/app/billing'],
  ['owner-login', '/app/login']
];

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const css = await (await fetch(BASE + '/tapfour-app.css')).text();
const fixCss = s => s.replace(/url\('([a-z-]+\.woff2)'\)/g, "url('/assets/$1')");

// owner session
await page.goto(BASE + '/app/login');
await page.fill('input[name=email]', 'owner@kapenorte.example');
await page.fill('input[name=password]', 'kape-norte-local');
await Promise.all([page.waitForURL(/\/app$/), page.click('button.btn--lime')]);

for (const [name, path] of PAGES) {
  if (name === 'owner-login') await ctx.clearCookies();
  await page.goto(BASE + path);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT + name + '.png', fullPage: true });
  let html = await page.content();
  html = html.replace(/<link rel="stylesheet" href="\/tapfour-app.css">/, `<style>${fixCss(css)}</style>`)
    .replace(/<link rel="preload"[^>]*>/g, '')
    .replace(/<script>[\s\S]*?<\/script>/g, '')
    .replace(/(src|href)="\/((tapfour|stand|card|bar)[a-z0-9-]*\.jpg|favicon\.svg)"/g, '$1="/assets/$2"')
    .replace(/<head>/, '<head><base target="_blank">');
  fs.writeFileSync(OUT + name + '.html', html);
  console.log('captured', name);
}
await browser.close();
