// PLATE · Finishes, then the end card: glossy black (hero) and glossy white. Studio. The camera rises and pulls
// back so the stands settle in the lower third under the end-card copy.
import * as THREE from 'three';
import { makeSet } from '../js/set.js';
import { kf, ease, seg } from '../js/anim.js';

export const duration = 9.5;
export const END = 4.2; // end card starts
let S, b, w, TY;
export async function init(ctx) {
  S = await makeSet({ ...ctx, mood: 'studio', fov: 24 });
  TY = +(ctx.params.ty || 150); // end-card look height: lower = stands sit higher in frame
  b = await S.stand({ design: 'menu', finish: 'black', pos: [-44, 0, 10], rotY: 0.2 });
  w = await S.stand({ design: 'menu', finish: 'white', pos: [44, 0, -24], rotY: -0.2 });
}
export async function update(t) {
  const e = ease.inOut(seg(t, END - 0.4, END + 1.6));
  const cp = kf(t, [[0, [60, 128, 640]], [END - 0.4, [24, 118, 590]], [END + 1.6, [0, 250, 700]], [duration, [0, 244, 680]]], ease.inOut);
  const tg = kf(t, [[0, [0, 70, -8]], [END - 0.4, [0, 68, -8]], [END + 1.6, [0, TY, -5]], [duration, [0, TY, -5]]], ease.inOut);
  S.cam.position.set(...cp); S.cam.lookAt(...tg);
  S.scene.environmentRotation.y = -0.6 + t * 0.1;
  S.render();
}
