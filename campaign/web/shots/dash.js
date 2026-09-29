// PLATE · The owner's dashboard (real markup): today's taps, scans, review opens and menu views count up,
// then busiest hours and what people opened. Numbers are the local demo data (labelled "sample data" on screen).
import { phone2d, backdrop } from '../js/phone2d.js';
import { kf, ease, seg, countTo } from '../js/anim.js';

export const duration = 7.4;
let PY, ph, tiles, vals, bars, hint, peak, splits;
// a café day: quiet morning, lunch peak, evening peak (sample data)
const HOURS = [2, 1, 0, 0, 0, 0, 1, 4, 9, 14, 18, 26, 44, 40, 22, 18, 20, 27, 38, 42, 30, 16, 8, 4];

export async function init(ctx) {
  ctx.canvas.style.display = 'none';
  backdrop(ctx.ui, '/web/img/bg_open_blur.jpg', { dim: 0.55 });
  PY = +(ctx.params.py ?? 110);
  ph = await phone2d(ctx.ui, { src: '/screens/owner-home.html', pw: +(ctx.params.pw || 590) });
  // same one-line fix the product needs (see campaign/README): mobile grid column must be minmax(0, 1fr)
  ph.doc.head.insertAdjacentHTML('beforeend', '<style>@media (max-width: 900px) { .app { grid-template-columns: minmax(0, 1fr) !important; } }</style>');
  tiles = ph.$$('.card')[0].querySelectorAll('.tile b');
  vals = [...tiles].map(b => Number(b.textContent.replace(/,/g, '')));
  const hoursCard = ph.$$('.card').find(c => c.textContent.includes('BUSIEST HOURS'));
  bars = [...hoursCard.querySelectorAll('.mini-bars i')];
  hint = hoursCard.querySelector('.hint');
  peak = hoursCard.querySelector('.card__head span:last-child');
  const max = Math.max(...HOURS), top = HOURS.map((v, h) => [v, h]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(x => x[1]);
  bars.forEach((b, h) => { b.dataset.h = Math.max(3, Math.round(HOURS[h] / max * 100)); b.className = top.includes(h) ? 'on' : ''; });
  const hr = h => `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`;
  hint.textContent = `Busiest at ${top.map(hr).join(', ')}. Put someone near the stand then.`;
  peak.textContent = `PEAK ${hr(top[0])}`;
  splits = [...ph.$$('.split__bar i')].map(i => [i, i.style.width]);
}

export async function update(t) {
  const k = ease.out(seg(t, 0, 0.9));
  ph.place({ y: PY + 60 * (1 - k), rx: 8 * (1 - k) + 2, ry: -6 * (1 - k) - 2, s: 0.96 + 0.04 * k + 0.03 * ease.sine(seg(t, 0.9, duration)) });
  tiles.forEach((b, i) => { b.textContent = countTo(vals[i], t, 0.5 + i * 0.12, 1.9 + i * 0.12); });
  ph.scroll(kf(t, [[0, 0], [2.3, 0], [3.2, 300], [4.6, 300], [5.6, 1270], [duration, 1300]]));
  bars.forEach((b, h) => { b.style.height = `${Math.max(3, b.dataset.h * ease.out(seg(t, 2.8 + h * 0.02, 3.6 + h * 0.02)))}%`; });
  splits.forEach(([i, w], n) => { i.style.width = `calc(${w} * ${ease.out(seg(t, 5.6 + n * 0.08, 6.5 + n * 0.08))})`; });
}
