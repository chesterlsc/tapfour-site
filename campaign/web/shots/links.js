// PLATE · My links (real markup): change where the stands send people; the real confirmation after saving.
import { phone2d, backdrop } from '../js/phone2d.js';
import { el, kf, ease, seg } from '../js/anim.js';

export const duration = 5.6;
let ph, fb, save, flash, y0, PY;
const NEW = 'https://facebook.com/kapenorte.qc';

export async function init(ctx) {
  ctx.canvas.style.display = 'none';
  backdrop(ctx.ui, '/web/img/bg_open_blur.jpg', { dim: 0.55 });
  PY = +(ctx.params.py ?? 110);
  ph = await phone2d(ctx.ui, { src: '/screens/owner-links.html', pw: +(ctx.params.pw || 590) });
  fb = ph.$('input[name=facebook]');
  save = [...ph.$$('button')].find(b => b.textContent.includes('Save links'));
  // the flash the server renders after a save (views.js flash() + common.js saveLinks message)
  const head = ph.$('.app__main .sec__head');
  head.insertAdjacentHTML('beforebegin', '<div class="flash flash--ok" role="status" id="fl">Saved ✓ 1 link updated. Every stand uses the new link from the next tap. Press “Test this link” to check.</div>');
  flash = ph.$('#fl');
  y0 = fb.getBoundingClientRect().top; // measured with the flash present; scroll math below accounts for it
}

export async function update(t) {
  const k = ease.out(seg(t, 0, 0.9));
  ph.place({ y: PY + 50 * (1 - k), rx: 7 * (1 - k) + 2, ry: 6 * (1 - k) + 2, s: 0.97 + 0.03 * k });
  const saved = t >= 3.55;
  flash.style.display = saved ? '' : 'none';
  if (saved) { const f = ease.out(seg(t, 3.55, 3.9)); flash.style.opacity = f; flash.style.transform = `translateY(${(1 - f) * -10}px)`; }
  const fbTop = fb.getBoundingClientRect().top + (ph._scroll || 0);
  ph.scroll(saved ? 0 : kf(t, [[0, 0], [1.0, 0], [1.5, fbTop - 300], [2.9, fbTop - 300], [3.3, fbTop - 300]]));
  const c = Math.round(ease.sine(seg(t, 1.6, 2.7)) * NEW.length);
  fb.value = t < 1.55 ? 'https://facebook.com/kapenorte.example' : NEW.slice(0, Math.max(c, 8));
  fb.style.boxShadow = t > 1.5 && !saved ? '0 0 0 2px #c8f23c' : '';
  const r = fb.getBoundingClientRect(), b = save.getBoundingClientRect(), sc = ph._scroll || 0;
  if (t < 2.9) ph.tap(r.left + r.width - 50, r.top + r.height / 2 + sc, seg(t, 1.2, 1.6));
  else ph.tap(b.left + b.width / 2, b.top + b.height / 2 + sc, seg(t, 3.1, 3.5));
  // make sure the Save button is on screen when tapped
  if (t >= 2.9 && !saved) ph.scroll(kf(t, [[2.9, fbTop - 300], [3.1, b.top + sc - 600]]));
}
