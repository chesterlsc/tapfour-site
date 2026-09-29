// PLATE · Both products on the table: Tapfour Review and Tapfour Connect, glossy black. Warm café, slow arc.
import * as THREE from 'three';
import { makeSet } from '../js/set.js';
import { kf, ease, seg } from '../js/anim.js';

export const duration = 7.0;
let S;
export async function init(ctx) {
  S = await makeSet({ ...ctx, mood: 'warm', fov: 26, dof: { focus: 480, aperture: 0.00004, maxblur: 0.008 } });
  await S.stand({ design: 'review', finish: 'black', pos: [-30, 0, -75], rotY: 0.36 });
  await S.stand({ design: 'menu', finish: 'black', pos: [30, 0, 28], rotY: -0.2 });
  S.cup({ pos: [-150, 0, -210], rotY: 0.9 });
}
export async function update(t) {
  const a = kf(t, [[0, -0.2], [duration, 0.16]], ease.sine), r = kf(t, [[0, 660], [duration, 610]], ease.sine);
  S.cam.position.set(Math.sin(a) * r, kf(t, [[0, 190], [duration, 172]], ease.sine), Math.cos(a) * r);
  S.cam.lookAt(0, 100, -20);
  S.focus(S.cam.position.distanceTo(new THREE.Vector3(10, 50, 10)));
  S.scene.environmentRotation.y = -0.4 + t * 0.12;
  S.render();
}
