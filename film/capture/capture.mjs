// Captures every screen the film needs from the REAL platform Worker running locally (setup.sh + wrangler dev).
// Phone 393×852 and tablet 1180×820, both at 3× device scale, so the screens stay sharp at 4K.
// Film-only screens (table ordering, counter-tablet orders) are injected into the real pages' DOM so they use the
// repo's own markup and CSS; they are marked FILM-ONLY below and listed in PLAN.md under "Built for the film".
//
// Output: public/capture/*.png + public/capture/meta.json (element geometry in CSS px, used for touches, sticky
// headers and scrolls in the screen compositions).
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { OWNER } from './seed.mjs';

const BASE = 'http://127.0.0.1:8787';
const OUT = new URL('../public/capture/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const meta = {};
const UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const DPR = 3;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const phoneCtx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: DPR, userAgent: UA, isMobile: true, hasTouch: true });
const tabletCtx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: DPR, userAgent: UA.replace(' Mobile', '') });

const settle = async p => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150); };
const rect = (p, sel) => p.$eval(sel, el => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; });
const rects = (p, sel) => p.$$eval(sel, els => els.map(el => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height, text: el.innerText.split('\n')[0] }; }));
// Brand rule for the film: the leaf mark always sits beside the wordmark. The public pages' footer prints
// "POWERED BY tapfour" as text only, so the repo's own .tf-mark is added in front of it (the one change to real UI).
const fixLockup = () => document.querySelectorAll('.powered b').forEach(b => {
  if (!b.querySelector('.tf-mark')) b.insertAdjacentHTML('afterbegin', '<span class="tf-mark" style="font-size:13px;margin-right:4px;vertical-align:-2px" aria-hidden="true"></span>');
});
const shot = async (p, name, opts = {}) => { await p.evaluate(fixLockup); await settle(p); await p.screenshot({ path: OUT + name + '.png', ...opts }); console.log('  ' + name); };

// ---------- owner login (tablet) ----------
const tab = await tabletCtx.newPage();
await tab.goto(BASE + '/app/login');
await tab.fill('input[name=email]', OWNER.email);
await tab.fill('input[name=password]', OWNER.password);
await Promise.all([tab.waitForURL(BASE + '/app'), tab.click('button:has-text("Log in")')]);
const itemId = name => tab.$eval(`xpath=//div[contains(@class,"linkrow")][.//b[normalize-space(text()[1])="${name}"]]`, el => el.id.slice(1));

// ---------- 1. live menu, before (REAL) ----------
console.log('menu');
const ph = await phoneCtx.newPage();
const menuMeta = async () => ({
  height: await ph.evaluate(() => document.documentElement.scrollHeight),
  tabs: await rect(ph, '.mn__tabs'),
  cats: await rects(ph, '.mn__cat'),
  items: await rects(ph, '.mn__item')
});
await ph.goto(BASE + '/menu/kanto-coffee?d=K4NT01');
await shot(ph, 'menu-before', { fullPage: true });
meta.menuBefore = await menuMeta();

// ---------- 2. owner edits in /app/menu (REAL), then the menu again ----------
await tab.goto(BASE + '/app/menu');
const pandesal = await itemId('Ube Cheese Pandesal');
await tab.click(`#i${pandesal} button:has-text("Mark sold out")`);
await tab.waitForLoadState('networkidle');
const calamansi = await itemId('Calamansi Cold Brew');
await tab.evaluate(id => { const d = document.querySelector(`#i${id} details`); if (d) d.open = true; }, calamansi);
await tab.fill(`#i${calamansi} input[name=price]`, '175');
await Promise.all([tab.waitForURL(/msg=/), tab.click(`#i${calamansi} button:has-text("Save")`)]);
// The public menu is cached for 15 s (Cache-Control: public, max-age=15), so load it fresh the way a new guest would.
await ph.goto(BASE + '/menu/kanto-coffee?d=K4NT01&fresh=1', { waitUntil: 'networkidle' });
if (!(await ph.content()).includes('SOLD OUT') || !(await ph.content()).includes('₱175')) throw new Error('menu-after does not show the owner edits');
await shot(ph, 'menu-after', { fullPage: true });
meta.menuAfter = await menuMeta();

// ---------- 3. business page (REAL) ----------
console.log('links page');
await ph.goto(BASE + '/p/kanto-coffee');
await shot(ph, 'page-kanto');

// ---------- 4. owner dashboard, frame by frame (REAL page, numbers/bars driven from 0 to their real values) ----------
console.log('dashboard frames');
await tab.goto(BASE + '/app');
await settle(tab);
meta.dash = { height: await tab.evaluate(() => document.documentElement.scrollHeight), cards: await rects(tab, '.card') };
await tab.evaluate(() => {
  const nums = [...document.querySelectorAll('.tile b')].map(el => ({ el, v: Number(el.textContent.replace(/,/g, '')) }));
  const bars = [...document.querySelectorAll('.mini-bars i')].map(el => ({ el, h: parseFloat(el.style.height) }));
  const split = [...document.querySelectorAll('.split__bar i')].map(el => ({ el, w: parseFloat(el.style.width) }));
  const splitTxt = [...document.querySelectorAll('.split .mono')].map(el => ({ el, t: el.textContent }));
  const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const fmt = n => n.toLocaleString('en-US');
  // f = frame 0..150 of the dashboard sequence (see src/screens/TabletDashboard.tsx)
  window.__at = f => {
    nums.forEach(({ el, v }, i) => { const top = i < 4; const p = top ? ease((f - i * 3) / 40) : ease((f - 80 - (i - 4) * 3) / 45); el.textContent = fmt(Math.round(v * p)); });
    bars.forEach(({ el, h }, i) => { el.style.height = Math.max(0, h * ease((f - 22 - i * 1.6) / 22)) + '%'; });
    split.forEach(({ el, w }, i) => { el.style.width = w * ease((f - 95 - i * 10) / 40) + '%'; });
    splitTxt.forEach(({ el, t }, i) => { el.style.opacity = ease((f - 95 - i * 10) / 25); });
  };
});
const CLIP = { x: 0, y: 0, width: 1180, height: 1060 };
mkdirSync(OUT + 'dash', { recursive: true });
for (let f = 0; f <= 150; f++) {
  await tab.evaluate(f => window.__at(f), f);
  await tab.screenshot({ path: `${OUT}dash/${String(f).padStart(3, '0')}.jpg`, type: 'jpeg', quality: 94, clip: CLIP, fullPage: true });
}

// ---------- 5. counter tablet: orders (FILM-ONLY content inside the REAL owner-app shell) ----------
console.log('tablet orders (film-only)');
await tab.goto(BASE + '/app');
await tab.addStyleTag({ content: readFileSync(new URL('./film-only.css', import.meta.url), 'utf8') });
await tab.evaluate(() => {
  const nav = document.querySelector('.app__nav');
  nav.querySelectorAll('a').forEach(a => a.classList.remove('on'));
  const a = document.createElement('a'); a.href = '#'; a.className = 'on'; a.innerHTML = 'Orders<small class="fo-badge" hidden>1</small>';
  nav.insertBefore(a, nav.children[2]);
  document.querySelector('.app__main').innerHTML = `
    <div class="fo-head"><div><span class="mono-11 m3">TABLE ORDERING · LIVE</span><h1>Orders</h1></div><span class="pill"><i class="fo-dot"></i>LISTENING FOR ORDERS</span></div>
    <div class="card"><div class="card__head"><span>TODAY</span><span>PH TIME · LIVE</span></div>
      <div class="tiles"><div class="tile tile--hi"><small>NEW ORDERS</small><b data-new>0</b><em>Waiting for you</em></div>
      <div class="tile"><small>PREPARING</small><b data-prep>2</b><em>In the kitchen</em></div>
      <div class="tile"><small>SERVED TODAY</small><b>21</b><em>₱8,440</em></div>
      <div class="tile"><small>TABLES SEATED</small><b>9/12</b><em>Main floor</em></div></div></div>
    <div class="card"><div class="card__head"><span>LIVE ORDERS</span><span>NEWEST FIRST</span></div>
      <div class="lrows fo-orders">
        <div class="lrow fo-new" hidden><b>Table 7</b><span>Kanto Latte ×1, Ensaymada ×1, Tapsilog ×1</span><span class="pill pill--warn" data-st>NEW</span></div>
        <div class="lrow"><b>Table 3</b><span>Ube Latte ×2, Bibingka ×1</span><span class="pill pill--info">PREPARING</span></div>
        <div class="lrow"><b>Table 1</b><span>Barako Americano ×1, Turon ×2</span><span class="pill pill--info">PREPARING</span></div>
        <div class="lrow"><b>Table 5</b><span>Longsilog ×2, Calamansi Cold Brew ×2</span><span class="pill pill--mute">SERVED</span></div>
        <div class="lrow"><b>Counter</b><span>Spanish Latte ×1 · take-out</span><span class="pill pill--mute">SERVED</span></div>
      </div></div>
    <div class="fo-toast" hidden><span class="fo-toast__i"><i></i></span><span><small>NEW ORDER · JUST NOW</small><b>New order · Table 7 · 3 items</b></span><span class="fo-toast__go">Open →</span></div>
    <div class="fo-modal" hidden><div class="fo-modal__c">
      <div class="fo-modal__h"><span class="pill pill--warn">NEW ORDER</span><small class="mono-11 m3">JUST NOW · SENT FROM THE TABLE</small></div>
      <h2>Table 7</h2>
      <div class="fo-lines"><div><span>Kanto Latte</span><em>×1</em><b>₱160</b></div><div><span>Ensaymada</span><em>×1</em><b>₱95</b></div><div><span>Tapsilog</span><em>×1</em><b>₱245</b></div>
        <div class="fo-tot"><span>Total</span><b>₱500</b></div></div>
      <div class="fo-modal__a"><button class="btn btn--lime btn--lg" data-accept>Accept · send to kitchen</button><button class="btn btn--ghost btn--lg">Later</button></div>
    </div></div>`;
});
const T = (js, arg) => tab.evaluate(js, arg);
await shot(tab, 'orders-0');                                   // waiting
await T(() => { document.querySelector('.fo-new').hidden = false; document.querySelector('[data-new]').textContent = '1'; document.querySelector('.fo-badge').hidden = false; });
await shot(tab, 'orders-1');                                   // new row in the list
await T(() => { document.querySelector('.fo-toast').hidden = false; });
meta.ordersToast = await rect(tab, '.fo-toast');
await tab.locator('.fo-toast').screenshot({ path: OUT + 'orders-toast.png', omitBackground: true });
await T(() => { document.querySelector('.fo-toast').hidden = true; document.querySelector('.fo-modal').hidden = false; });
meta.ordersCard = await rect(tab, '.fo-modal__c');
meta.ordersAccept = await rect(tab, '[data-accept]');
await tab.locator('.fo-modal__c').screenshot({ path: OUT + 'orders-card.png', omitBackground: true });
await T(() => { document.querySelector('.fo-modal').hidden = true; const s = document.querySelector('[data-st]'); s.className = 'pill pill--info'; s.textContent = 'PREPARING';
  document.querySelector('[data-new]').textContent = '0'; document.querySelector('[data-prep]').textContent = '3'; document.querySelector('.fo-badge').hidden = true; });
await shot(tab, 'orders-2');                                   // accepted

// ---------- 6. guest table ordering (FILM-ONLY steppers + cart bar on the REAL menu page) ----------
console.log('guest ordering (film-only)');
await ph.goto(BASE + '/menu/kanto-coffee?d=K4NT01&table=7');
await ph.addStyleTag({ content: readFileSync(new URL('./film-only.css', import.meta.url), 'utf8') });
await ph.evaluate(() => {
  document.querySelector('.mn__head span:last-child small').textContent = 'TABLE 7 · ORDER HERE';
  document.querySelectorAll('.mn__item').forEach((row, i) => {
    const em = row.querySelector('em');
    const wrap = document.createElement('div'); wrap.className = 'fo-right';
    em.replaceWith(wrap); wrap.append(em);
    const q = document.createElement('span'); q.className = 'fo-q'; q.dataset.i = i; q.innerHTML = '<b hidden>0</b><button aria-label="Add">+</button>';
    wrap.append(q);
  });
  const bar = document.createElement('div'); bar.className = 'fo-cart'; bar.hidden = true;
  bar.innerHTML = '<span><small data-count>1 ITEM</small><b data-sum>₱0</b></span><button class="fo-cart__btn">Place order · Table 7</button>';
  document.body.append(bar);
  document.querySelector('.mn__foot').style.paddingBottom = '96px';
  window.__qty = {};
  window.__add = (name) => {
    const row = [...document.querySelectorAll('.mn__item')].find(r => r.querySelector('b').textContent === name);
    const q = row.querySelector('.fo-q'); const n = (window.__qty[name] = (window.__qty[name] || 0) + 1);
    q.classList.add('on'); q.querySelector('b').hidden = false; q.querySelector('b').textContent = n;
    const count = Object.values(window.__qty).reduce((a, b) => a + b, 0);
    const sum = Object.entries(window.__qty).reduce((a, [k, v]) => { const r = [...document.querySelectorAll('.mn__item')].find(r => r.querySelector('b').textContent === k); return a + v * Number(r.querySelector('em').textContent.replace(/[^\d]/g, '')); }, 0);
    bar.hidden = false; bar.querySelector('[data-count]').textContent = `${count} ITEM${count > 1 ? 'S' : ''}`; bar.querySelector('[data-sum]').textContent = '₱' + sum.toLocaleString('en-US');
  };
});
const orderMeta = async () => ({ height: await ph.evaluate(() => document.documentElement.scrollHeight), tabs: await rect(ph, '.mn__tabs'), cats: await rects(ph, '.mn__cat'), items: await rects(ph, '.mn__item'), adds: await rects(ph, '.fo-q button') });
const hideCart = v => ph.evaluate(v => { document.querySelector('.fo-cart').style.visibility = v ? 'hidden' : ''; }, v);
const cartShot = async name => { await hideCart(false); await ph.locator('.fo-cart').screenshot({ path: OUT + name + '.png', omitBackground: true }); await hideCart(true); };
meta.order = { steps: [] };
await hideCart(true);
await shot(ph, 'order-0', { fullPage: true });
meta.order.steps.push(await orderMeta());
for (const [i, name] of ['Kanto Latte', 'Ensaymada', 'Tapsilog'].entries()) {
  await ph.evaluate(n => window.__add(n), name);
  await hideCart(true);
  await shot(ph, `order-${i + 1}`, { fullPage: true });
  await cartShot(`order-cart-${i + 1}`);
  meta.order.steps.push(await orderMeta());
}
await hideCart(false);
meta.order.cart = await ph.$eval('.fo-cart', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
meta.order.cartBtn = await ph.$eval('.fo-cart__btn', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
meta.order.tabsLabels = await ph.$$eval('.mn__tabs a', els => els.map(e => { const r = e.getBoundingClientRect(); return { x: r.x, w: r.width, text: e.textContent }; }));
// Sticky section tabs with each tab active (the real page highlights the first; ordering highlights the section in view)
for (const [k, label] of ['Coffee', 'Pastries', 'All-day silog'].entries()) {
  await ph.evaluate(() => scrollTo(0, 0));
  await ph.evaluate(k => document.querySelectorAll('.mn__tabs a').forEach((a, i) => a.classList.toggle('fo-on', i === k)), k);
  await ph.addStyleTag({ content: '.mn__tabs a:first-child{background:none;color:var(--m1);box-shadow:inset 0 0 0 1px var(--l4)}' });
  await ph.locator('.mn__tabs').screenshot({ path: `${OUT}order-tabs-${k}.png` });
}

// Order status (FILM-ONLY), same page shell
for (const [k, st] of [['received', 0], ['preparing', 1]]) {
  await ph.goto(BASE + '/menu/kanto-coffee?d=K4NT01&table=7');
  await ph.addStyleTag({ content: readFileSync(new URL('./film-only.css', import.meta.url), 'utf8') });
  await ph.evaluate(st => {
    const steps = ['Sent', 'Received', 'Preparing', 'Served'];
    document.querySelector('.mn').innerHTML = `
      <header class="mn__head"><span class="mn__logo">KC</span><span><small>TABLE 7 · YOUR ORDER</small><h1>Kanto Coffee</h1></span></header>
      <div class="fo-status">
        <div class="fo-status__icon ${st ? 'prep' : ''}"><i></i></div>
        <small class="mono-11 lime">${st ? 'IN THE KITCHEN' : 'SENT TO THE COUNTER · 7:42 PM'}</small>
        <h2>${st ? 'Preparing' : 'Order received'}</h2>
        <p>${st ? 'The kitchen is on it. We’ll bring it to Table 7.' : 'Your server has your order. Hang tight.'}</p>
        <div class="fo-steps">${steps.map((l, i) => `<span class="${i <= st + 1 ? 'on' : ''}${i === st + 1 ? ' now' : ''}"><i></i>${l}</span>`).join('')}</div>
      </div>
      <div class="fo-sum"><div class="card__head"><span>YOUR ORDER</span><span>3 ITEMS</span></div>
        <div><span>Kanto Latte</span><em>×1</em><b>₱160</b></div><div><span>Ensaymada</span><em>×1</em><b>₱95</b></div><div><span>Tapsilog</span><em>×1</em><b>₱245</b></div>
        <div class="fo-tot"><span>Total</span><b>₱500</b></div></div>
      <div class="fo-quick"><button>Call server</button><button>Bill please</button></div>
      <div class="mn__foot"><div class="powered">POWERED BY <b>tapfour</b></div></div>`;
  }, st);
  await shot(ph, `order-${k}`);
}

// ---------- 7. menu setup (REAL): empty menu → paste the whole menu → added ----------
console.log('menu setup');
const MENU_TEXT = readFileSync(new URL('./menu-paste.txt', import.meta.url), 'utf8');
await tab.goto(BASE + '/app/menu');
// Clear the menu through the real UI's routes (the "setup" story starts from nothing)
const ids = await tab.$$eval('.linkrow[id^=i]', els => els.map(e => e.id.slice(1)));
for (const id of ids) await tab.evaluate(id => fetch(`/app/menu/${id}/delete`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: '' }), id);
await tab.goto(BASE + '/app/menu');
await shot(tab, 'setup-0');
await tab.fill('textarea[name=text]', MENU_TEXT);
await tab.evaluate(() => { const t = document.querySelector('textarea[name=text]'); t.style.height = (t.scrollHeight + 8) + 'px'; t.scrollTop = 0; });
await shot(tab, 'setup-1', { fullPage: true });
meta.setup1Height = await tab.evaluate(() => document.documentElement.scrollHeight);
meta.setupButton = await rect(tab, 'button:has-text("Add these items")');
tab.once('dialog', d => d.accept());
await Promise.all([tab.waitForURL(/msg=/), tab.click('button:has-text("Add these items")')]);
await shot(tab, 'setup-2', { fullPage: true });
meta.setup2Height = await tab.evaluate(() => document.documentElement.scrollHeight);

// Restore the menu state used by the rest of the film (sold out + price edit) so re-runs are consistent.
writeFileSync(OUT + 'meta.json', JSON.stringify(meta, null, 1));
await browser.close();
console.log('done →', OUT);
