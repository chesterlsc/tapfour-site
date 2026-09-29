// PLATE · The object: macro details (edge + corner, the bend and base), then a frontal hero with real dimensions.
import * as THREE from 'three';
import { makeSet } from '../js/set.js';
import { facePoint } from '../js/stand.js';
import { el, kf, ease, seg } from '../js/anim.js';

export const duration = 9.2;
let S, stand, dims, P;
const CUTS = [2.3, 4.6];

export async function init(ctx) {
  P = ctx.params;
  S = await makeSet({ ...ctx, mood: 'studio', fov: 24, dof: { focus: 200, aperture: 0.00006, maxblur: 0.01 } });
  stand = await S.stand({ design: P.design || 'review', finish: P.finish || 'black', rotY: 0 });
  // dimension callouts (drawn from the model's real geometry)
  dims = el(ctx.ui, ''); Object.assign(dims.style, { position: 'absolute', inset: 0 });
  dims.innerHTML = `<svg width="100%" height="100%" style="position:absolute;inset:0;overflow:visible"><g stroke="rgba(242,240,235,.7)" stroke-width="2" fill="none">
    <path id="dh"/><path id="dw"/></g></svg>
    <div id="lh" class="mono" style="position:absolute;color:var(--fg);letter-spacing:.14em;transform:translate(-50%,-50%) rotate(-90deg);white-space:nowrap">105 mm</div>
    <div id="lw" class="mono" style="position:absolute;color:var(--fg);letter-spacing:.14em">70 mm</div>`;
}

const proj = v => { const p = v.clone().project(S.cam); return [(p.x + 1) / 2 * S.R.domElement.width, (1 - p.y) / 2 * S.R.domElement.height]; };

export async function update(t) {
  const L = stand.userData.layout;
  let pos, tgt, f;
  stand.rotation.y = 0;
  if (t < CUTS[0]) { // 1 · top corner and edge, a highlight gliding along the gloss
    const k = t / CUTS[0];
    pos = kf(k, [[0, [120, 150, 95]], [1, [95, 142, 110]]], ease.sine); tgt = [26, 100, -6];
    S.scene.environmentRotation.y = -0.9 + k * 1.1;
    f = S.cam.position.distanceTo(new THREE.Vector3(30, 100, -8));
  } else if (t < CUTS[1]) { // 2 · the bend and the base, low side angle
    const k = (t - CUTS[0]) / (CUTS[1] - CUTS[0]);
    stand.rotation.y = -1.18 - 0.3 * ease.sine(k);
    pos = kf(k, [[0, [-20, 40, 290]], [1, [-8, 42, 272]]], ease.sine); tgt = [-6, 30, -12];
    S.scene.environmentRotation.y = 0.2 + k * 0.6;
    f = S.cam.position.distanceTo(new THREE.Vector3(0, 30, -8));
  } else { // 3 · frontal hero, the whole stand, dimensions draw on
    const k = seg(t, CUTS[1], duration);
    pos = kf(k, [[0, [150, 124, 500]], [1, [70, 108, 462]]], ease.out); tgt = kf(k, [[0, [0, 60, -5]], [1, [0, 58, -5]]], ease.out);
    S.scene.environmentRotation.y = -0.4 + ease.inOut(k) * 0.7;
    f = S.cam.position.distanceTo(new THREE.Vector3(0, 55, 0));
  }
  S.cam.position.set(...pos); S.cam.lookAt(...tgt);
  S.focus(f);
  S.render();
  // dimensions: only in the hero section
  const d = seg(t, CUTS[1] + 1.2, CUTS[1] + 2.2), o = t > CUTS[1] ? 1 : 0;
  dims.style.opacity = String(o * ease.sine(seg(t, CUTS[1] + 1.1, CUTS[1] + 1.5)) * (1 - seg(t, duration - 0.4, duration)));
  if (o) {
    const top = facePoint(L, -L.W / 2, 0).p, bot = new THREE.Vector3(-L.W / 2, 0, L.rOut * 0.9);
    const [x1, y1] = proj(top.clone().add(new THREE.Vector3(-9, 0, 0))), [x2, y2] = proj(bot.clone().add(new THREE.Vector3(-9, 0, 0)));
    const e = ease.inOut(d), ym = y1 + (y2 - y1) * e;
    dims.querySelector('#dh').setAttribute('d', `M${x1 - 10},${y1} h20 M${x1},${y1} L${x1 + (x2 - x1) * e},${ym} ${e > 0.98 ? `M${x2 - 10},${y2} h20` : ''}`);
    const lh = dims.querySelector('#lh'); Object.assign(lh.style, { left: `${x1 - 30}px`, top: `${(y1 + y2) / 2}px`, opacity: String(e) });
    const [a1, b1] = proj(new THREE.Vector3(-L.W / 2, -2, L.rOut + 16)), [a2, b2] = proj(new THREE.Vector3(L.W / 2, -2, L.rOut + 16));
    const e2 = ease.inOut(seg(t, CUTS[1] + 1.6, CUTS[1] + 2.6));
    dims.querySelector('#dw').setAttribute('d', `M${a1},${b1 - 10} v20 M${a1},${b1} L${a1 + (a2 - a1) * e2},${b1 + (b2 - b1) * e2} ${e2 > 0.98 ? `M${a2},${b2 - 10} v20` : ''}`);
    const lw = dims.querySelector('#lw'); Object.assign(lw.style, { left: `${(a1 + a2) / 2 - 50}px`, top: `${(b1 + b2) / 2 + 18}px`, opacity: String(e2) });
  }
}
