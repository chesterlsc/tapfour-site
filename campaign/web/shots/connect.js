// PLATE · Tapfour Connect: the Review stand turns away, the Connect stand (Review + QR menu) turns in. Studio.
import * as THREE from 'three';
import { makeSet } from '../js/set.js';
import { kf, ease, seg } from '../js/anim.js';

export const duration = 5.4;
let S, a, b;
export async function init(ctx) {
  S = await makeSet({ ...ctx, mood: 'studio', fov: 24 });
  a = await S.stand({ design: 'review', finish: 'black' });
  b = await S.stand({ design: 'menu', finish: 'black' });
}
export async function update(t) {
  // turntable swap: A spins out to the left, B spins in from the right, both on the same spot
  const k = ease.inOut(seg(t, 0.35, 1.9));
  a.rotation.y = -k * Math.PI * 0.9; a.position.x = -k * 190; a.visible = k < 0.98;
  b.rotation.y = (1 - k) * Math.PI * 0.9 + 0.12 * (1 - ease.out(seg(t, 1.9, duration))) - 0.05; b.position.x = (1 - k) * 190; b.visible = k > 0.02;
  const d = kf(t, [[0, 520], [1.9, 480], [duration, 430]], ease.sine);
  S.cam.position.set(40, 115, d); S.cam.lookAt(0, 62, -5);
  S.scene.environmentRotation.y = -0.5 + t * 0.14;
  S.render();
}
