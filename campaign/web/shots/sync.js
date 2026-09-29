// PLATE · Owner control: the owner marks Spanish Latte sold out and changes a price in the real menu editor;
// the guest's menu shows it on the next load (the real guest page reloads, it doesn't push live).
import { phone2d, backdrop } from '../js/phone2d.js';
import { el, kf, ease, seg } from '../js/anim.js';

export const duration = 9.0;
export const BEATS = { soldTap: 1.5, guest1: 2.2, editOpen: 4.6, type: 5.1, save: 6.0, guest2: 6.6 };
let own, gst, stage, oRow, oBtn, oPrice, oDet, oInput, gOut, gPrice, gLatte, bar;

const OUT_HTML = '<br><span class="mn__out">SOLD OUT</span>';

let PY = 40;
export async function init(ctx) {
  PY = +(ctx.params.py ?? 90);
  ctx.canvas.style.display = 'none';
  backdrop(ctx.ui, '/web/img/bg_open_blur.jpg', { dim: 0.5 });
  stage = el(ctx.ui, ''); Object.assign(stage.style, { position: 'absolute', inset: 0, transformOrigin: '50% 50%' });
  own = await phone2d(stage, { src: '/screens/owner-menu.html', pw: 490 });
  gst = await phone2d(stage, { src: '/screens/guest-menu.html', pw: 490 });
  // owner: start with Spanish Latte available (exactly what the server renders when sold_out = 0)
  oRow = own.$('#i4'); oRow.removeAttribute('style');
  oBtn = oRow.querySelector('form button'); oBtn.className = 'btn btn--sm btn--ghost'; oBtn.textContent = 'Mark sold out';
  const sag = own.$('#i1'); oPrice = sag.querySelector('.mono.lime'); oDet = sag.querySelector('details'); oInput = oDet.querySelector('input[name=price]');
  // guest: same, available
  const items = gst.$$('.mn__item');
  gLatte = items.find(i => i.textContent.includes('Spanish Latte')); gLatte.classList.remove('out'); gOut = gLatte.querySelector('div');
  gOut.innerHTML = gOut.innerHTML.replace(OUT_HTML, '');
  gPrice = items.find(i => i.textContent.includes('Sagada Latte')).querySelector('em');
  bar = el(gst.scr, ''); Object.assign(bar.style, { position: 'absolute', left: 0, top: 0, height: '4px', background: '#c8f23c', zIndex: 6, width: 0 });
}

const flash = (e, t, t0) => { const k = seg(t, t0, t0 + 1.2); e.style.boxShadow = k > 0 && k < 1 ? `inset 0 0 0 2px rgba(200,242,60,${(1 - k).toFixed(3)})` : ''; e.style.background = k > 0 && k < 1 ? `rgba(200,242,60,${(0.12 * (1 - k)).toFixed(3)})` : ''; };

export async function update(t) {
  const B = BEATS;
  // layout: owner left, guest right; a slow push toward the rows that change
  const k = ease.out(seg(t, 0, 0.9));
  own.place({ x: -258, y: PY + 30 * (1 - k), ry: 7, rz: -1, s: 1 });
  gst.place({ x: 258, y: PY + 30 * (1 - k), ry: -7, rz: 1, s: 1 });
  // camera: overview → owner (tap) → guest (sees it) → owner (price) → guest → overview
  const [z, fx, fy] = kf(t, [[0, [1, 0, 0]], [0.9, [1, 0, 0]], [1.3, [1.42, -258, 80]], [2.05, [1.42, -258, 80]], [2.45, [1.42, 258, 20]], [3.8, [1.42, 258, 20]], [4.25, [1.42, -258, 40]], [6.25, [1.42, -258, 40]], [6.6, [1.42, 258, -120]], [8.1, [1.42, 258, -120]], [8.8, [1, 0, 0]]]);
  stage.style.transform = `scale(${z}) translate(${-fx}px, ${-fy}px)`;
  // owner scrolls to the Coffee list
  own.scroll(kf(t, [[0, 820], [1.1, 1100], [4.0, 1100], [4.5, 880], [9, 880]]));
  gst.scroll(0);
  // 1 · sold out
  const sold = t >= B.soldTap + 0.12;
  oBtn.className = `btn btn--sm ${sold ? 'btn--lime' : 'btn--ghost'}`; oBtn.textContent = sold ? 'Sold out · tap to bring back' : 'Mark sold out';
  oRow.style.opacity = sold ? '.6' : '';
  const b = oBtn.getBoundingClientRect();
  own.tap(b.left + b.width / 2, b.top + b.height / 2 + own._scroll, seg(t, B.soldTap - 0.25, B.soldTap + 0.2));
  // guest reloads → sees SOLD OUT
  const g1 = t >= B.guest1 + 0.35;
  gLatte.classList.toggle('out', g1);
  gOut.innerHTML = gOut.innerHTML.replace(OUT_HTML, '') + (g1 ? OUT_HTML : '');
  flash(gLatte, t, B.guest1 + 0.35);
  // 2 · price 165 → 175 in the Edit form
  oDet.open = t >= B.editOpen;
  const typed = t < B.type ? '165' : t < B.type + 0.25 ? '16' : t < B.type + 0.45 ? '1' : t < B.type + 0.7 ? '17' : '175';
  oInput.value = typed; oInput.style.boxShadow = t >= B.type - 0.1 && t < B.save ? '0 0 0 2px #c8f23c' : '';
  const saved = t >= B.save + 0.1;
  oPrice.textContent = saved ? '₱175' : '₱165';
  const sum = oDet.querySelector('summary').getBoundingClientRect(), save = oDet.querySelector('button').getBoundingClientRect(), inp = oInput.getBoundingClientRect();
  if (t < B.editOpen + 0.3) own.tap(sum.left + 40, sum.top + sum.height / 2 + own._scroll, seg(t, B.editOpen - 0.3, B.editOpen + 0.15));
  else if (t < B.type + 0.2) own.tap(inp.left + inp.width - 40, inp.top + inp.height / 2 + own._scroll, seg(t, B.type - 0.35, B.type + 0.05));
  else own.tap(save.left + save.width / 2, save.top + save.height / 2 + own._scroll, seg(t, B.save - 0.25, B.save + 0.2));
  const g2 = t >= B.guest2 + 0.35;
  gPrice.textContent = g2 ? '₱175' : '₱165';
  flash(gPrice.parentElement, t, B.guest2 + 0.35);
  // the guest page reloading: a quick progress bar and a soft refresh of the content
  const r1 = seg(t, B.guest1, B.guest1 + 0.45), r2 = seg(t, B.guest2, B.guest2 + 0.45);
  const r = r1 > 0 && r1 < 1 ? r1 : r2 > 0 && r2 < 1 ? r2 : 0;
  bar.style.width = `${r * 100}%`; bar.style.opacity = r > 0 ? 1 : 0;
  gst.frame.style.opacity = r > 0.6 && r < 0.9 ? 0.75 : 1;
}
