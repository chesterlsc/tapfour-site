import { chromium } from 'playwright-core';
const SP = process.env.SP;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
const phone = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, userAgent: UA, isMobile: true, hasTouch: true });
let p = await phone.newPage();
for (const [n, u] of [['menu', '/menu/kanto-coffee?d=K4NT01'], ['links', '/p/kanto-coffee']]) {
  await p.goto('http://127.0.0.1:8787' + u); await p.screenshot({ path: `${SP}/look-${n}.png`, fullPage: true });
}
const tab = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, userAgent: UA.replace('Mobile ', '') });
p = await tab.newPage();
await p.goto('http://127.0.0.1:8787/app/login');
await p.fill('input[name=email]', 'owner@kantocoffee.example'); await p.fill('input[name=password]', 'kanto-film-local');
await Promise.all([p.waitForURL('**/app'), p.click('button[type=submit], button:has-text("Log in")')]);
await p.screenshot({ path: `${SP}/look-app.png`, fullPage: true });
await p.goto('http://127.0.0.1:8787/app/menu'); await p.screenshot({ path: `${SP}/look-appmenu.png`, fullPage: true });
await b.close();
