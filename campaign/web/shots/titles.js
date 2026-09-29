// TITLE LAYER · Renders an edit's copy as a transparent overlay (composited over the plates by build.mjs).
// ?edit=master. Cue kinds: text, shade, scrim, steps, tag, checks, endcard, legal.
import { el, line, reveal, fade, ease, seg, clamp } from '../js/anim.js';
import { layout, resolveCues, total } from '../edits/timing.js';

export let duration = 1;
let cues = [], R = [];
const LEAF = ['M0 6H2.2A8.8 12.8 0 0 1 11 18.8V22H8.8A8.8 12.8 0 0 1 0 9.2Z', 'M12 14.8A8.8 12.8 0 0 1 20.8 2H23V5.2A8.8 12.8 0 0 1 14.2 18H12Z'];

export async function init(ctx) {
  ctx.canvas.style.display = 'none';
  document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
  const name = ctx.params.edit || 'master';
  let edit;
  if (name.startsWith('statics:')) { // one frame: segment [T-3, T+1], every cue fully revealed at T
    const st = (await import(`/web/edits/statics.js?v=${Date.now()}`)).default.find(x => x.name === name.slice(8));
    edit = { segments: [[st.plate, st.T - 3, st.T + 1]], cues: st.cues.map(c => ({ ...c, at: st.plate, t: st.T - 2.6, out: st.T + 5 })) };
  } else edit = (await import(`/web/edits/${name}.js?v=${Date.now()}`)).default;
  const segs = layout(edit.segments);
  duration = total(segs);
  cues = resolveCues(edit.cues, segs);
  const ui = ctx.ui;
  for (const c of cues) R.push(build(ui, c));
}

function block(ui, c) {
  const b = el(ui, 'stack' + (c.align === 'left' ? ' stack--left' : ''));
  b.style.top = `calc(${c.y} * var(--u))`;
  if (c.x !== undefined) { b.style.left = `calc(${c.x} * var(--u))`; b.style.right = 'auto'; }
  if (c.width) { b.style.width = `calc(${c.width} * var(--u))`; }
  return b;
}

function build(ui, c) {
  if (c.kind === 'text') {
    const b = block(ui, c);
    const lines = c.lines.map(([cls, html, d = 0]) => ({ e: line(b, cls + (c.shadow === false ? '' : ' shadow'), html), d }));
    return t => lines.forEach(({ e, d }) => reveal(e, t, c.t + d, c.out - (c.outStagger ? 0 : 0), { dur: c.dur || 0.7 }));
  }
  if (c.kind === 'shade') {
    const e = el(ui, ''); Object.assign(e.style, { position: 'absolute', inset: 0, background: 'radial-gradient(120% 70% at 50% 45%, rgba(8,6,5,.55), rgba(5,4,3,.9))' });
    return t => { fade(e, t, c.t, c.out, c.in ?? 0.5, c.fadeOut ?? 0.6); e.style.opacity = String(+e.style.opacity * (c.opacity ?? 0.92)); };
  }
  if (c.kind === 'scrim') {
    const e = el(ui, ''), top = c.side !== 'bottom';
    Object.assign(e.style, { position: 'absolute', left: 0, right: 0, height: `calc(${c.h} * var(--u))`, [top ? 'top' : 'bottom']: 0, background: `linear-gradient(${top ? '180deg' : '0deg'}, rgba(6,6,7,${c.opacity ?? 0.85}) 0%, rgba(6,6,7,${(c.opacity ?? 0.85) * 0.7}) 55%, rgba(6,6,7,0) 100%)` });
    return t => fade(e, t, c.t, c.out, 0.35, 0.35);
  }
  if (c.kind === 'steps') {
    const b = block(ui, c);
    const title = line(b, 'sub shadow', c.title); title.style.marginBottom = 'calc(22 * var(--u))';
    const list = el(b, 'steps');
    const rows = c.items.map((s, i) => { const r = el(list, 'step', `<i>0${i + 1}</i><b>${s}</b>`); r.style.position = 'relative'; const k = el(r, 'strike'); k.style.left = 'calc(24 * var(--u))'; k.style.right = 'calc(24 * var(--u))'; return { r, k }; });
    return t => {
      reveal(title, t, c.t, c.out);
      rows.forEach(({ r, k }, i) => {
        reveal(r, t, c.t + 0.35 + i * c.stagger, c.out, { dy: 0.35, dur: 0.6 });
        const st = c.t + c.strike + i * 0.09;
        k.style.transform = `scaleX(${ease.inOut(seg(t, st, st + 0.35))})`;
        r.style.color = t > st + 0.15 ? 'rgba(242,240,235,.45)' : '';
      });
    };
  }
  if (c.kind === 'tag') {
    const e = el(ui, 'tag-sample', c.text); Object.assign(e.style, { left: `calc(50% + ${c.x} * var(--u))`, top: `calc(${c.y} * var(--u))`, transform: 'translateX(-50%)' });
    return t => fade(e, t, c.t, c.out, 0.4, 0.3);
  }
  if (c.kind === 'checks') {
    const b = block(ui, { ...c, align: 'left' });
    b.style.left = '50%'; b.style.right = 'auto'; b.style.transform = 'translateX(-50%)'; b.style.gap = 'calc(22 * var(--u))';
    const head = c.head ? line(b, 'mono shadow', c.head) : null;
    const rows = c.items.map(s => line(b, 'h3 shadow', `<span class="ck"></span>${s}`));
    return t => { if (head) reveal(head, t, c.t, c.out); rows.forEach((r, i) => reveal(r, t, c.t + 0.3 + i * (c.stagger || 0.45), c.out)); };
  }
  if (c.kind === 'endcard') {
    const b = block(ui, c); b.style.gap = 'calc(26 * var(--u))';
    const logo = el(b, 'endlogo', `<svg viewBox="0 0 23 22" class="leafs"><path class="l1" d="${LEAF[0]}"/><path class="l2" d="${LEAF[1]}"/></svg><span class="word">tapfour</span>`);
    const sub = line(b, 'sub', c.sub);
    const cta = el(b, 'pill pill--lime cta', c.cta);
    const fine = c.fine ? line(b, 'mono', c.fine) : null;
    const l1 = logo.querySelector('.l1'), l2 = logo.querySelector('.l2'), word = logo.querySelector('.word');
    return t => {
      const a = ease.expo(seg(t, c.t, c.t + 0.9)), a2 = ease.expo(seg(t, c.t + 0.12, c.t + 1.0));
      l1.style.transform = `scale(${a})`; l2.style.transform = `scale(${a2})`;
      word.style.opacity = String(ease.out(seg(t, c.t + 0.25, c.t + 0.9))); word.style.transform = `translateX(${(1 - ease.expo(seg(t, c.t + 0.25, c.t + 1.1))) * -24}px)`;
      logo.style.opacity = String(1 - seg(t, c.out, c.out + 0.4));
      reveal(sub, t, c.t + 0.6, c.out);
      const p = ease.expo(seg(t, c.t + 1.0, c.t + 1.7)); cta.style.opacity = String(p * (1 - seg(t, c.out, c.out + 0.4))); cta.style.transform = `translateY(${(1 - p) * 20}px) scale(${0.96 + 0.04 * p})`;
      if (fine) reveal(fine, t, c.t + 1.4, c.out);
    };
  }
  if (c.kind === 'legal') {
    const e = el(ui, 'legal', c.text); e.style.top = `calc(${c.y} * var(--u))`;
    return t => fade(e, t, c.t, c.out, 0.4, 0.3);
  }
  throw new Error('unknown cue ' + c.kind);
}

export async function update(t) { for (const f of R) f(t); }
