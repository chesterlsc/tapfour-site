// PLATE · Scan for the menu: the phone's camera sees the Connect stand's QR (a live second render of the
// same 3D stand), the link chip appears, tap → the real live menu from the tapfour platform.
import * as THREE from 'three';
import { makeSet } from '../js/set.js';
import { facePoint } from '../js/stand.js';
import { phone2d } from '../js/phone2d.js';
import { el, kf, ease, seg } from '../js/anim.js';

export const duration = 6.0;
let S, stand, ph, rt, camP, cv, g, px, ui, menu, P;
const RW = 585, RH = 1266;

export async function init(ctx) {
  P = ctx.params;
  S = await makeSet({ ...ctx, mood: 'warm', fov: 28, dof: { focus: 420, aperture: 0.00005, maxblur: 0.008 } });
  stand = await S.stand({ design: 'menu', finish: 'black', rotY: 0.12 });
  S.cup({ pos: [-150, 0, -120], rotY: 1.2 });
  rt = new THREE.WebGLRenderTarget(RW, RH, { samples: 0 });
  camP = new THREE.PerspectiveCamera(46, RW / RH, 1, 30000);
  px = new Uint8Array(RW * RH * 4);
  ph = await phone2d(ctx.ui, { src: '/screens/guest-menu.html', pw: 560 });
  // camera app layer inside the phone screen (above the page)
  ui = el(ph.scr, ''); Object.assign(ui.style, { position: 'absolute', inset: 0, background: '#000', zIndex: 5 });
  cv = el(ui, '', '', 'canvas'); cv.width = RW; cv.height = RH; Object.assign(cv.style, { position: 'absolute', inset: 0, width: '100%', height: '100%' });
  g = cv.getContext('2d');
  ui.insertAdjacentHTML('beforeend', `
    <svg id="brk" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"><path fill="none" stroke="#ffd60a" stroke-width="3" stroke-linecap="round"/></svg>
    <div id="chip" style="position:absolute;left:50%;transform:translateX(-50%);padding:9px 16px;border-radius:99px;background:#ffd60a;color:#1a1a1a;font:600 15px 'Instrument Sans';white-space:nowrap;display:flex;gap:7px;align-items:center">
      <span style="width:16px;height:16px;border-radius:4px;background:#1a1a1a;display:inline-block"></span>go.tap4.ph</div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:150px;background:rgba(0,0,0,.55)"></div>
    <div style="position:absolute;left:50%;bottom:34px;width:66px;height:66px;margin-left:-33px;border-radius:50%;box-shadow:0 0 0 4px #fff inset;"><i style="position:absolute;inset:8px;border-radius:50%;background:#fff"></i></div>
    <div style="position:absolute;left:0;right:0;bottom:116px;text-align:center;font:600 12px 'Instrument Sans';letter-spacing:.08em;color:#ffd60a">PHOTO</div>
    <div style="position:absolute;left:50%;bottom:170px;transform:translateX(-50%);width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;font:600 12px 'Instrument Sans';display:grid;place-items:center">1×</div>`);
  ui.style.width = '100%'; ui.style.height = '100%';
  menu = ph.frame;
  // continuity: Spanish Latte is still available here; the owner marks it sold out in the next scene
  const latte = ph.$$('.mn__item').find(i => i.textContent.includes('Spanish Latte'));
  latte.classList.remove('out'); const d = latte.querySelector('div'); d.innerHTML = d.innerHTML.replace('<br><span class="mn__out">SOLD OUT</span>', '');
}

export async function update(t) {
  const L = stand.userData.layout, toW = v => v.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), stand.rotation.y);
  // main camera: behind the guest's hand, stand upper-left, phone lower-right
  const cp = kf(t, [[0, [-40, 150, 540]], [duration, [-30, 142, 505]]], ease.sine);
  S.cam.position.set(...cp); S.cam.lookAt(-8, 32, 0);
  // phone camera: aimed at the QR, drifting slightly (handheld), then steady
  const qr = toW(facePoint(L, 14.4, 50.5).p);
  const wob = (1 - seg(t, 0.6, 1.4)) * 1;
  const pc = new THREE.Vector3(30 + 12 * Math.sin(t * 2.1) * wob, 70 + 8 * Math.cos(t * 1.7) * wob, 210).add(new THREE.Vector3(qr.x * 0.4, 0, 0));
  camP.position.copy(pc); camP.lookAt(qr.x - 12 + 6 * wob * Math.sin(t * 3), qr.y + 2, qr.z);
  // live viewfinder: render the same scene from the phone camera, copy into the phone screen
  S.sync();
  S.R.setRenderTarget(rt); S.R.render(S.scene, camP); S.R.readRenderTargetPixels(rt, 0, 0, RW, RH, px); S.R.setRenderTarget(null);
  const img = new ImageData(new Uint8ClampedArray(px.buffer), RW, RH);
  const tmp = await createImageBitmap(img);
  g.save(); g.translate(0, RH); g.scale(1, -1); g.drawImage(tmp, 0, 0); g.restore(); tmp.close();
  // QR brackets from the projected QR corners
  const s = 11.5, corners = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([dx, dy]) => { const p = toW(facePoint(L, 14.4 + dx, 50.5 + dy).p).project(camP); return [(p.x + 1) / 2 * 390, (1 - p.y) / 2 * 844]; });
  const det = ease.out(seg(t, 1.1, 1.45)), path = corners.map(([x, y], i) => {
    const [nx, ny] = corners[(i + 1) % 4], [bx, by] = corners[(i + 3) % 4], k = 0.28;
    return `M${x + (nx - x) * k},${y + (ny - y) * k} L${x},${y} L${x + (bx - x) * k},${y + (by - y) * k}`;
  }).join(' ');
  const brk = ui.querySelector('#brk path'); brk.setAttribute('d', path); brk.parentNode.setAttribute('viewBox', '0 0 390 844'); brk.style.opacity = det;
  const chip = ui.querySelector('#chip'), cy = Math.max(...corners.map(c => c[1])) + 26;
  Object.assign(chip.style, { top: `${cy * ph.scale}px`, opacity: String(ease.out(seg(t, 1.3, 1.6))), transform: `translateX(-50%) scale(${ph.scale * (0.9 + 0.1 * ease.out(seg(t, 1.3, 1.6)))})`, transformOrigin: 'top center' });
  // tap the chip → the live menu slides up
  ph.tap(195, cy + 18, seg(t, 1.85, 2.25));
  const open = ease.expo(seg(t, 2.2, 2.75));
  ui.style.transform = `translateY(${-open * 12}%)`; ui.style.opacity = String(1 - open);
  menu.style.transform = `scale(${ph.scale}) translateY(${(1 - open) * 80}px)`;
  ph.scroll(ease.inOut(seg(t, 3.6, 5.6)) * 330);
  // phone: held up lower-right, tilting toward us
  const k = ease.out(seg(t, 0, 1.2));
  ph.place({ x: 150 - 30 * k, y: 300 - 60 * k, rx: 6, ry: -16 + 8 * k, rz: -5 + 3 * k, s: 1 });
  S.focus(S.cam.position.distanceTo(new THREE.Vector3(0, 55, 0)));
  S.render();
}
