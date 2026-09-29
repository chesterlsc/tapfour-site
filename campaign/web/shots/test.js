import * as THREE from 'three';
import { makeRenderer, makeEnvironment, makeCyc, makeTable, contactShadow, mirrorOf, addKeyLights } from '../js/world.js';
import { makeStand } from '../js/stand.js';

let R, scene, cam, stand;
export const duration = 1;
export async function init({ W, H, canvas, params }) {
  R = makeRenderer(canvas, W, H);
  scene = new THREE.Scene();
  scene.environment = makeEnvironment(R, params.mood || 'studio');
  addKeyLights(scene, params.mood || 'studio');
  const qrData = await (await fetch('/web/data/qr.json')).json();
  stand = makeStand({ design: params.design || 'review', finish: params.finish || 'black', qrData });
  stand.rotation.y = -0.55;
  scene.add(makeCyc({ warm: params.mood === 'warm' }), makeTable({ warm: params.mood === 'warm' }));
  const sh = contactShadow(74, 44); sh.position.z = -16; sh.rotation.z = 0; const shg = new THREE.Group(); shg.add(sh); shg.rotation.y = -0.55;
  scene.add(shg, stand, mirrorOf(stand));
  cam = new THREE.PerspectiveCamera(20, W / H, 1, 20000);
  cam.position.set(0, 150, 620); cam.lookAt(0, 52, -10);
}
export async function update(t) { R.render(scene, cam); }
