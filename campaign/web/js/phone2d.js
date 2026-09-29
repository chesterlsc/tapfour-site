// A phone mockup in the DOM showing a real page (iframe), so UI stays crisp at any size.
// Position is relative to the frame centre in 1080-units; rotate with CSS 3D.
import { el } from './anim.js';

export async function phone2d(parent, { src, pw = 620, x = 0, y = 0 }) {
  const wrap = el(parent, ''); Object.assign(wrap.style, { position: 'absolute', inset: 0, perspective: '2400px' });
  const ph = el(wrap, 'phone'); ph.style.setProperty('--pw', pw);
  const inner = el(ph, 'phone__in'), scr = el(inner, 'phone__scr');
  el(inner, 'phone__cam');
  const frame = el(scr, '', '', 'iframe'); frame.setAttribute('scrolling', 'no');
  const glare = el(inner, 'phone__glare');
  const touch = el(scr, 'touch'); touch.style.opacity = 0;
  await new Promise(r => { frame.onload = r; frame.src = src; });
  const doc = frame.contentDocument, win = frame.contentWindow;
  await doc.fonts?.ready;
  const api = {
    el: ph, wrap, frame, doc, win, glare, scr,
    get scale() { return scr.clientWidth / 390; },
    fit() { frame.style.transform = `scale(${api.scale})`; },
    // x, y in page CSS px (390 wide); y is relative to the page top, minus the current scroll
    place({ x = 0, y = 0, rx = 0, ry = 0, rz = 0, s = 1 }) {
      ph.style.setProperty('--px', x); ph.style.setProperty('--py', y);
      ph.style.transform = `translate(-50%, -50%) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
    },
    scroll(px) { doc.documentElement.style.transform = `translateY(${-px}px)`; api._scroll = px; },
    tap(x, y, k) { // k: 0..1 press animation (0 = hidden)
      const s = api.scale;
      Object.assign(touch.style, { left: `${x * s}px`, top: `${(y - (api._scroll || 0)) * s}px`, opacity: k > 0 && k < 1 ? String(Math.sin(k * Math.PI) * 0.95) : '0', transform: `scale(${0.6 + 0.4 * Math.sin(Math.min(1, k * 2) * Math.PI / 2)})` });
    },
    $(sel) { return doc.querySelector(sel); },
    $$(sel) { return [...doc.querySelectorAll(sel)]; }
  };
  doc.documentElement.style.overflow = 'hidden';
  api.fit();
  return api;
}

// Blurred still behind the DOM phones (rendered once from a 3D set).
export function backdrop(parent, src, { dim = 0.35 } = {}) {
  const b = el(parent, ''); Object.assign(b.style, { position: 'absolute', inset: '-4%', backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' });
  const d = el(parent, ''); Object.assign(d.style, { position: 'absolute', inset: 0, background: `radial-gradient(90% 60% at 50% 50%, rgba(0,0,0,${dim * 0.6}), rgba(0,0,0,${Math.min(1, dim * 1.6)}))` });
  return b;
}
