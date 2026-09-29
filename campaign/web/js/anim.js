// Deterministic DOM animation: every style is a pure function of t (seconds), so any frame renders the same.
import { ease, clamp, seg, lerp } from './world.js';
export { ease, clamp, seg, lerp };

export const el = (parent, cls, html = '', tag = 'div') => { const e = document.createElement(tag); if (cls) e.className = cls; e.innerHTML = html; parent.appendChild(e); return e; };

// Line reveal: text rises out of a mask and settles; fades out at tOut.
export function reveal(e, t, tIn, tOut = Infinity, { dy = 0.6, dur = 0.7, outDur = 0.35, blur = 0 } = {}) {
  const a = ease.expo(seg(t, tIn, tIn + dur)), b = ease.inOut(seg(t, tOut, tOut + outDur));
  const inner = e.firstElementChild?.classList.contains('rv__i') ? e.firstElementChild : e;
  inner.style.transform = `translateY(${(1 - a) * dy * 100}%)`;
  e.style.opacity = String(clamp(a * 1.4) * (1 - b));
  if (blur) e.style.filter = `blur(${(1 - a) * blur}px)`;
}
// Wrap text so reveal() can slide it inside an overflow mask.
export const line = (parent, cls, html) => { const o = el(parent, 'rv ' + cls); el(o, 'rv__i', html, 'span'); return o; };

export function fade(e, t, tIn, tOut = Infinity, dIn = 0.4, dOut = 0.4) {
  e.style.opacity = String(ease.sine(seg(t, tIn, tIn + dIn)) * (1 - ease.sine(seg(t, tOut, tOut + dOut))));
}

// Piecewise keyframes: [[t, v], ...] with easing per segment (default inOut).
export function kf(t, keys, fn = ease.inOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i], k = (keys[i][2] || fn)((t - t0) / (t1 - t0));
    return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], k)) : lerp(v0, v1, k);
  }
  return keys[keys.length - 1][1];
}

// Count-up for numbers shown in the real dashboard markup.
export const countTo = (n, t, t0, t1) => Math.round(n * ease.out(seg(t, t0, t1))).toLocaleString('en-PH');
