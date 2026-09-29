// PLATE · 0:00 Hook → the long way to a review → the stand comes into focus.
// One continuous take at an evening café table. Copy lives in the title layer.
import * as THREE from 'three';
import { makeSet } from '../js/set.js';
import { kf, ease } from '../js/anim.js';

export const duration = 12.2;
let S;
const CUP = new THREE.Vector3(-58, 45, 215), STAND = new THREE.Vector3(0, 52, 0);

export async function init(ctx) {
  S = await makeSet({ ...ctx, mood: 'warm', fov: 30, dof: { focus: 300, aperture: 0.00004, maxblur: 0.008 } });
  await S.stand({ design: 'review', finish: 'black', pos: [0, 0, 0], rotY: 0.22 });
  S.cup({ pos: [-58, 0, 215], rotY: 2.2 });
  await S.stand({ design: 'menu', finish: 'black', pos: [230, 0, -620], rotY: -0.35 });
  S.cup({ pos: [120, 0, -700], rotY: 0.6 });
  await S.stand({ design: 'review', finish: 'black', pos: [-300, 0, -900], rotY: 0.5 });
}

export async function update(t) {
  const pos = kf(t, [[0, [60, 205, 600]], [3.3, [46, 196, 545]], [8.2, [30, 182, 480]], [11.6, [22, 176, 470]], [12.2, [21, 174, 462]]], ease.sine);
  const tgt = kf(t, [[0, [-14, 118, 60]], [3.3, [-12, 114, 40]], [8.2, [-6, 108, 20]], [11.6, [2, 104, 0]], [12.2, [2, 103, 0]]], ease.sine);
  S.cam.position.set(...pos); S.cam.lookAt(...tgt);
  // focus: the cup (the meal), everything soft behind the list, then rack onto the stand
  const dCup = S.cam.position.distanceTo(CUP), dStand = S.cam.position.distanceTo(STAND);
  S.focus(kf(t, [[0, dCup], [3.3, dCup], [3.9, 90], [7.9, 90], [9.3, dStand], [12.2, dStand]]),
    kf(t, [[0, 0.00004], [3.3, 0.00004], [3.9, 0.00007], [7.9, 0.00007], [9.3, 0.00004]]));
  // light sweep across the gloss as the stand is revealed
  S.scene.environmentRotation.y = kf(t, [[0, -0.25], [8.4, -0.1], [11.4, 0.55]], ease.inOut);
  S.render();
}
