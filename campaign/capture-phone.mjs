// Stills of the designed phone screens (web/phone/*.html) for textures on the 3D phone.
import { chromium } from 'playwright-core';
import { serve } from './server.mjs';
const { server, port } = await serve();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.goto(`http://127.0.0.1:${port}/web/phone/review.html`);
await page.evaluate(() => document.fonts.ready);
for (const [name, s] of [['phone-lock', { view: 'lock', banner: 0 }], ['phone-lock-nfc', { view: 'lock', banner: 1 }], ['phone-review', { view: 'rev', stars: 0, load: 1, url: 'search.google.com' }]]) {
  await page.evaluate(s => window.state(s), s);
  await page.screenshot({ path: `screens/${name}.png` });
  console.log(name);
}
await browser.close(); server.close();
