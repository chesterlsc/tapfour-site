// The tap: a guest dips their phone onto the stand's tap spot; the phone wakes with the NFC prompt.
// Real scale: 105 mm stand, 152 mm phone.
import * as THREE from 'three';
import { makeSet } from '../js/set.js';
import { facePoint } from '../js/stand.js';
import { PHONE } from '../js/props.js';
import { el, kf, ease, seg, clamp } from '../js/anim.js';

export const duration = 3.9;
export const CONTACT = 2.15; // phone touches the stand
let S, stand, phone, imgs = {}, ring, P;

const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });

export async function init(ctx) {
  P = ctx.params;
  S = await makeSet({ ...ctx, mood: P.mood || 'warm', fov: 26 });
  stand = await S.stand({ design: P.design || 'review', finish: 'black', rotY: 0.32 });
  S.R.toneMappingExposure = 1.22;
  S.cup({ pos: [-175, 0, -330], rotY: 1.2 });
  phone = S.phone();
  imgs.lock = await load('/screens/phone-lock.png');
  imgs.nfc = await load('/screens/phone-lock-nfc.png');
  ring = el(ctx.ui, ''); Object.assign(ring.style, { position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', boxShadow: '0 0 0 2px rgba(242,240,235,.55)', opacity: 0 });
}

// Phone pose at contact, in the stand's local space: top edge on the tap spot, tilted back toward the guest.
function contactPose() {
  const L = stand.userData.layout;
  const { p: C, n } = facePoint(L, 0, 66.5, 0.4);
  const beta = THREE.MathUtils.degToRad(24);
  const yaw = new THREE.Vector3(0, 1, 0), YAW = 0.42; // guest stands a little to the right
  const top = new THREE.Vector3(0, -Math.sin(beta), -Math.cos(beta)).applyAxisAngle(yaw, YAW);
  const scr = new THREE.Vector3(0, Math.cos(beta), -Math.sin(beta)).applyAxisAngle(yaw, YAW); // screen up, toward the guest looking down
  const x = new THREE.Vector3().crossVectors(top, scr).normalize();
  const m = new THREE.Matrix4().makeBasis(x, top, scr);
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  const tipLocal = new THREE.Vector3(0, PHONE.H / 2 - 1, -PHONE.T / 2 + 1);
  const pos = C.clone().sub(tipLocal.applyQuaternion(q)).addScaledVector(n, 0.6);
  return { pos, q, n, top };
}

export async function update(t) {
  const c = contactPose();
  const toWorld = v => v.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), stand.rotation.y).add(stand.position);
  const qStand = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), stand.rotation.y);
  // approach: from above-right-front, along the phone's own axis, easing into the touch; small press + release
  const k = ease.out(seg(t, 0.0, CONTACT)), back = 0.12 * ease.inOut(seg(t, CONTACT + 0.5, duration));
  const press = Math.sin(clamp((t - CONTACT) / 0.18) * Math.PI) * 0.8;
  const approach = new THREE.Vector3().addScaledVector(c.top, -(1 - k) * 240 - back * 60).add(new THREE.Vector3(30, 40 + back * 90, 0).multiplyScalar((1 - k) + back));
  approach.addScaledVector(c.n, -press);
  phone.position.copy(toWorld(c.pos.clone().add(approach)));
  const wob = new THREE.Quaternion().setFromEuler(new THREE.Euler((1 - k) * 0.22 + back * 0.5, (1 - k) * -0.12, (1 - k) * 0.1));
  phone.quaternion.copy(qStand).multiply(c.q).multiply(wob);
  // screen: already awake (iPhones read tags only with the screen on); the NFC prompt drops in on the tap
  const u = phone.userData, g = u.ctx, wake = 1;
  g.fillStyle = '#000'; g.fillRect(0, 0, 1170, 2532);
  if (wake > 0) {
    g.globalAlpha = wake; g.drawImage(imgs.lock, 0, 0);
    const b = ease.expo(seg(t, CONTACT + 0.12, CONTACT + 0.6));
    if (b > 0) { g.globalAlpha = wake * b; g.drawImage(imgs.nfc, 0, 0); }
    g.globalAlpha = 1;
  }
  u.tex.needsUpdate = true;
  // camera: 3/4 from the guest's side, easing in as the phone lands
  const cp = kf(t, [[0, [300, 420, 330]], [CONTACT, [272, 392, 300]], [duration, [236, 352, 262]]], ease.sine);
  S.cam.position.set(...cp); S.cam.lookAt(...kf(t, [[0, [4, 92, 12]], [CONTACT, [6, 86, 16]], [duration, [14, 78, 30]]], ease.sine));
  // a faint ring at the moment of contact (motion graphic, not a light on the stand)
  const r = seg(t, CONTACT, CONTACT + 0.7);
  if (r > 0 && r < 1) {
    const w = toWorld(facePoint(stand.userData.layout, 0, 66.5, 1).p).project(S.cam);
    const x = (w.x + 1) / 2 * S.R.domElement.width, y = (1 - w.y) / 2 * S.R.domElement.height, d = 40 + 260 * ease.out(r);
    Object.assign(ring.style, { left: `${x - d / 2}px`, top: `${y - d / 2}px`, width: `${d}px`, height: `${d}px`, opacity: String((1 - r) * 0.8) });
  } else ring.style.opacity = 0;
  S.render();
}
