// Stand face artwork for the 3D L-stands, rebuilt as vector and laid out to match the supplied product renders:
// brand fonts from assets/, the leaf mark from assets/favicon.svg, the Google G, the contactless glyph and a real QR
// (qrcode-generator, the same library the platform uses; leaf centre like the printed product).
// Output: public/art/{review,menu}-{black,white}.png at 2000×3000 (the 100×150 mm face).
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import qrcode from 'qrcode-generator';

const OUT = new URL('../public/art/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const FONTS = new URL('../../assets/', import.meta.url).href;

// The film QR opens the tapfour site, so anyone scanning the film lands somewhere real (not a demo tap code).
export const QR_URL = 'https://tap4.ph';

export const LEAF = (fill) => `<svg viewBox="0 0 23 22" xmlns="http://www.w3.org/2000/svg"><g fill="${fill}" transform="translate(0 -2)"><path d="M0 6H2.2A8.8 12.8 0 0 1 11 18.8V22H8.8A8.8 12.8 0 0 1 0 9.2Z"/><path d="M12 14.8A8.8 12.8 0 0 1 20.8 2H23V5.2A8.8 12.8 0 0 1 14.2 18H12Z"/></g></svg>`;
export const GOOGLE_G = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
export const NFC = (c) => `<svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${c}" stroke-width="5.2" stroke-linecap="round"><circle cx="8" cy="40" r="4.2" fill="${c}" stroke="none"/><path d="M18 28a17 17 0 0 1 0 24"/><path d="M28 19a29 29 0 0 1 0 42"/><path d="M38 10a41 41 0 0 1 0 60"/><path d="M48 3a51 51 0 0 1 0 74" opacity="0"/></svg>`;

function qrSvg(dark, light) {
  const q = qrcode(0, 'H'); q.addData(QR_URL); q.make();
  const n = q.getModuleCount(), c = n / 2, hole = 3.4; // leaf in the centre (H = 30% error correction)
  const finder = (x, y) => `<rect x="${x + .5}" y="${y + .5}" width="6" height="6" rx="1.9" fill="none" stroke="${dark}" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".9" fill="${dark}"/>`;
  const inFinder = (r, k) => (r < 7 && k < 7) || (r < 7 && k >= n - 7) || (r >= n - 7 && k < 7);
  let dots = '';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
    if (!q.isDark(r, k) || inFinder(r, k)) continue;
    if (Math.abs(r + .5 - c) < hole && Math.abs(k + .5 - c) < hole) continue;
    dots += `<circle cx="${k + .5}" cy="${r + .5}" r=".43" fill="${dark}"/>`;
  }
  return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" xmlns="http://www.w3.org/2000/svg">${light ? `<rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" rx="2.4" fill="${light}"/>` : ''}${dots}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}
    <g transform="translate(${c - 2.3} ${c - 2.2}) scale(.2)">${LEAF('#8fc31f').replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
}

const page = (design, finish) => {
  const black = finish === 'black';
  const fg = black ? '#f2f0eb' : '#0a0a0b', bg = black ? '#050506' : '#eeede8', ring = black ? '#c8f23c' : '#0a0a0b';
  const powered = `<div class="pw"><span>POWERED BY</span><span class="lk"><i>${LEAF('#8fd11c')}</i>tapfour</span></div>`;
  const ringG = (d) => `<div class="ring" style="width:${d}px;height:${d}px"><i>${GOOGLE_G}</i></div>`;
  // Positions are centres (px on the 2000×3000 face), measured from the supplied renders unwarped to the face plane.
  const at = (y) => `top:${y}px;transform:translateY(-50%)`;
  const body = design === 'review' ? `
    <h1 style="${at(665)};font-size:200px" data-w="1420">Leave us a review</h1>
    <div class="abs" style="${at(1380)};left:50%;margin-left:-375px">${ringG(750)}</div>
    <div class="abs nfc" style="${at(1932)};left:50%;margin-left:-75px">${NFC(fg)}</div>
    <div class="mono" style="${at(2222)};font-size:60px;letter-spacing:.24em;padding-left:.24em">TAP YOUR PHONE HERE</div>${powered}` : `
    <h1 style="${at(706)};font-size:180px;line-height:1.18" data-w="1260">Review or<br>view our menu</h1>
    <div class="abs" style="top:${1552 - 304}px;left:${568 - 320}px;width:640px;text-align:center">${ringG(608)}<p class="cap" style="margin-top:${1948 - 1552 - 304 - 40}px">Tap to review</p></div>
    <div class="abs div" style="top:1228px;left:985px;height:812px"></div>
    <div class="abs" style="top:${1552 - 284}px;left:${1446 - 320}px;width:640px;text-align:center"><div class="qr">${qrSvg('#0a0a0b', black ? '#f4f3ef' : null)}</div><p class="cap" style="margin-top:${1968 - 1552 - 284 - 40}px">Scan for menu</p></div>
    <div class="mono" style="${at(2300)};font-size:52px;letter-spacing:.3em;padding-left:.3em">TAP OR SCAN</div>${powered}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Instrument Sans';font-weight:400 700;src:url('${FONTS}instrument-sans-latin.woff2') format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:400 700;src:url('${FONTS}jetbrains-mono-latin.woff2') format('woff2')}
html,body{margin:0;width:2000px;height:3000px;background:${bg};overflow:hidden}
body{position:relative;color:${fg};font-family:'Instrument Sans',sans-serif}
.abs{position:absolute}
h1{position:absolute;left:0;right:0;margin:0;text-align:center;font-weight:700;letter-spacing:-.06em;line-height:1}
.ring{border-radius:50%;box-shadow:inset 0 0 0 ${black ? 22 : 18}px ${ring};display:grid;place-items:center;margin:0 auto}
.ring i{display:block;width:47%;height:47%}.ring svg{width:100%;height:100%}
.nfc svg{width:150px;height:200px}
.mono{position:absolute;left:0;right:0;text-align:center;font-family:'JetBrains Mono';font-weight:600;line-height:1}
.cap{margin:0;font-size:68px;line-height:80px;font-weight:500;letter-spacing:-.03em}
.div{width:5px;background:${fg};opacity:.8}
.qr{width:568px;height:568px;margin:0 auto}.qr svg{width:100%;height:100%}
.pw{position:absolute;left:0;right:0;top:2624px;transform:translateY(-50%);display:flex;justify-content:center;align-items:center;gap:40px}
.pw>span:first-child{font:600 50px 'JetBrains Mono';letter-spacing:.36em}
.lk{display:flex;align-items:center;gap:22px;font-size:110px;font-weight:700;letter-spacing:-.045em}
.lk i{display:block;width:105px;height:100px}.lk svg{width:100%;height:100%;display:block}
</style></head><body>${body}</body></html>`;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 2000, height: 3000 } });
  for (const design of ['review', 'menu']) for (const finish of ['black', 'white']) {
    const tmp = `${OUT}.tmp.html`; writeFileSync(tmp, page(design, finish));
    await p.goto('file://' + tmp, { waitUntil: 'load' }); rmSync(tmp);
    await p.evaluate(() => document.fonts.ready);
    // Fit the headline to the width measured on the print (data-w).
    await p.evaluate(() => { const h = document.querySelector('h1'); const r = document.createRange(); r.selectNodeContents(h); const w = r.getBoundingClientRect().width; h.style.fontSize = parseFloat(getComputedStyle(h).fontSize) * (Number(h.dataset.w) / w) + 'px'; });
    await p.screenshot({ path: `${OUT}${design}-${finish}.png` });
    console.log(design, finish);
  }
  await b.close();
}
