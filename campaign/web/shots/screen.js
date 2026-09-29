// PLATE · The phone after the tap: NFC prompt → go.tap4.ph → the business's Google review page (simulated screen).
import { phone2d, backdrop } from '../js/phone2d.js';
import { kf, ease, seg } from '../js/anim.js';

export const duration = 5.6;
let ph, bg, stars, PY;

export async function init(ctx) {
  ctx.canvas.style.display = 'none';
  bg = backdrop(ctx.ui, '/web/img/bg_tap_blur.jpg', { dim: 0.22 });
  PY = +(ctx.params.py ?? 120);
  ph = await phone2d(ctx.ui, { src: '/web/phone/review.html', pw: +(ctx.params.pw || 560) });
  ph.win.state({ view: 'rev' });
  const r = [...ph.doc.querySelectorAll('.star')].map(s => s.getBoundingClientRect());
  stars = r.map(b => [b.left + b.width / 2, b.top + b.height / 2]);
}

export async function update(t) {
  const k = ease.out(seg(t, 0, 0.9));
  ph.place({ y: PY + 30 - 20 * k, rx: 16 * (1 - k) + 3, ry: -14 * (1 - k) - 2, rz: 4 * (1 - k), s: 0.94 + 0.06 * k + 0.035 * ease.sine(seg(t, 0.9, duration)) });
  bg.style.transform = `scale(${1.04 + 0.03 * seg(t, 0, duration)})`;
  const view = t < 0.72 ? 'lock' : 'rev';
  const n = [1.95, 2.08, 2.21, 2.34, 2.47].filter(x => t >= x).length;
  ph.win.state({
    view, banner: 1,
    load: seg(t, 0.72, 1.4),
    url: t < 1.08 ? 'go.tap4.ph' : 'search.google.com',
    stars: n,
    typed: ease.sine(seg(t, 2.95, 4.5)),
    post: t > 4.6
  });
  if (t < 0.8) ph.tap(195, 283, seg(t, 0.38, 0.72));
  else if (t < 2.8) ph.tap(stars[4][0], stars[4][1], seg(t, 2.3, 2.75));
  else ph.tap(195, 800, seg(t, 4.5, 4.9));
}
