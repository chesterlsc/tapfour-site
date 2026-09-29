// The 3D shots. Each is a pure function of the shot-local time t (seconds); timings come from timeline.ts.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene3D } from '../three/Scene';
import { Stand, Phone, Tablet, TabletStand, STAND, PHONE, TABLET, standPoint, ART, drift, tween, useScreenTexture, screenSrc, LIME } from '../three/kit';
import { DarkStudio, LimeStudio, WarmStudio, Cafe, Post, Cup, Plant, woodTex } from '../three/studios';
import { CamAt, VF_STAND_RY, qrWorld } from './Stills';
import { SUPERS, BEATS, ShotId } from '../timeline';
import { Q } from '../three/quality';
import { SuperText, C, SANS, MONO, ease, easeIO, useInOut } from '../brand';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);
const basis = (right: THREE.Vector3, up: THREE.Vector3, front: THREE.Vector3) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, front));
// Orientation whose +z (screen) points at `eye`, with `upHint` as up.
const facing = (pos: THREE.Vector3, eye: THREE.Vector3, upHint = Y) => {
  const front = eye.clone().sub(pos).normalize();
  const right = upHint.clone().cross(front).normalize();
  const up = front.clone().cross(right).normalize();
  return basis(right, up, front);
};
const lerpV = (a: THREE.Vector3, b: THREE.Vector3, k: number) => a.clone().lerp(b, k);
const slerpQ = (a: THREE.Quaternion, b: THREE.Quaternion, k: number) => a.clone().slerp(b, k);
const useLocal = (offset = 0) => { const f = useCurrentFrame(), { fps } = useVideoConfig(); return { f: f + Math.round(offset * fps), t: f / fps + offset }; };

export const Supers: React.FC<{ id: ShotId; dark?: boolean }> = ({ id, dark }) => <>{SUPERS[id].map((s, i) => <SuperText key={i} {...s} dark={dark} />)}</>;

/* ======================= 2 · Reveal — lime studio, black + white Review + Menu stands ======================= */
export const ShotReveal: React.FC = () => {
  const { t } = useLocal();
  const k = tween(t, 0, 5.6, 0, 1, easeIO);
  const pos = lerpV(V(-22, 16, 60), V(0, 12, 55), k), target = lerpV(V(3, 8.8, 0), V(6.5, 8.2, 0), k);
  return (
    <Scene3D overlay={<Supers id="reveal" dark />}>
      <CamAt pos={pos} target={target} fov={26} />
      <LimeStudio>
        <Stand finish="black" design="menu" position={[6, 0, 0]} rotation-y={-0.18} />
        <Stand finish="white" design="menu" position={[19, 0, -7]} rotation-y={-0.32} />
      </LimeStudio>
      <Post focus={V(10, 8, -2)} range={30} bokeh={1.5} vignette={0.25} bloom={0.1} />
    </Scene3D>
  );
};

/* ======================= 3 · One tap — dark studio ======================= */
const Ripple: React.FC<{ t: number; at: number; pos: THREE.Vector3; quat: THREE.Quaternion; color?: THREE.Color; size?: number }> = ({ t, at, pos, quat, color = LIME, size = 6 }) => (
  <group position={pos} quaternion={quat}>
    {[0, 1, 2].map(i => {
      const u = (t - at - i * 0.17) / 1.25;
      if (u < 0 || u > 1) return null;
      const r = 0.5 + ease(u) * size, w = 0.07 + 0.12 * (1 - u);
      return (
        <mesh key={i} position={[0, 0, 0.02 + i * 0.001]}>
          <ringGeometry args={[r - w, r, 96]} />
          <meshBasicMaterial color={color} transparent opacity={Math.pow(1 - u, 1.6) * 0.95} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      );
    })}
    {t > at && t < at + 0.7 && (
      <mesh position={[0, 0, 0.015]}><circleGeometry args={[1.6, 48]} /><meshBasicMaterial color={color} transparent opacity={0.55 * (1 - (t - at) / 0.7)} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    )}
  </group>
);

const TapScene: React.FC = () => {
  const { t, f } = useLocal();
  const B = BEATS.tap;
  const tex = useScreenTexture(screenSrc('tap', f), screenSrc('tap', f + 1));
  const P = useMemo(() => {
    const tilt = STAND.TILT;
    const u = V(0, Math.cos(tilt), -Math.sin(tilt)), n = V(0, Math.sin(tilt), Math.cos(tilt)), r = V(1, 0, 0);
    const glyph = standPoint(ART.nfc[0], ART.nfc[1]);
    // The tag sits ~6 cm above the table, so the phone comes in almost flat: top edge to the tag, screen up toward the guest.
    const beta = THREE.MathUtils.degToRad(68), yaw = 0.2;
    const up = u.clone().multiplyScalar(Math.cos(beta)).addScaledVector(n, -Math.sin(beta)).applyAxisAngle(n, yaw);
    const front = n.clone().multiplyScalar(Math.cos(beta)).addScaledVector(u, Math.sin(beta)).applyAxisAngle(n, yaw);
    const right = up.clone().cross(front).normalize();
    const qC = basis(right, up, front);
    const cC = glyph.clone().addScaledVector(n, 0.06).addScaledVector(up, -PHONE.H / 2 + 0.2).addScaledVector(front, PHONE.D / 2);
    const q0 = qC.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 0.35));
    const c0 = cC.clone().add(V(14, 12, 18));
    const camEnd = V(-0.5, 21.5, 71);
    const H = V(6.2, 17, 24);
    const qH = facing(H, camEnd.clone().add(V(-2, 5, 0))).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -0.05));
    return { glyph, n, qFace: new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -tilt), qC, cC, q0, c0, H, qH, camEnd, front };
  }, []);
  // phone path
  let pos: THREE.Vector3, quat: THREE.Quaternion;
  if (t < B.contact) {
    const k = ease(Math.min(1, t / B.contact));
    pos = lerpV(P.c0, P.cC, k); quat = slerpQ(P.q0, P.qC, k);
  } else if (t < 1.95) {
    const j = t - B.contact;
    pos = P.cC.clone().addScaledVector(P.front, 0.09 * Math.sin(j * 2 * Math.PI * 22) * Math.exp(-j * 14)); quat = P.qC;
  } else {
    const k = easeIO(Math.min(1, (t - 1.95) / 1.3));
    pos = lerpV(P.cC, P.H, k).add(V(0, Math.sin(k * Math.PI) * 4, 0)); quat = slerpQ(P.qC, P.qH, k);
    const d = drift(t, 0.14 * k, 2.2); pos.add(V(...d));
  }
  const kc = tween(t, 1.85, 3.35, 0, 1, easeIO), kp = tween(t, 3.35, 10, 0, 1, easeIO);
  const camPos = lerpV(lerpV(V(38, 12.5, 24), V(33, 11.5, 21), tween(t, 0, 1.85)), P.camEnd, kc).lerp(V(-0.4, 21, 64), kp);
  const camT = lerpV(V(-1, 7, 4), V(-0.5, 17.6, 24), kc).lerp(V(-0.3, 17.6, 24), kp);
  const focus = lerpV(P.glyph, P.H, kc);
  const glyphW = P.glyph.clone().addScaledVector(P.n, 0.01);
  return (
    <>
      <CamAt pos={camPos} target={camT} fov={26} />
      <DarkStudio>
        <Stand finish="black" design="review" />
        <Ripple t={t} at={B.contact} pos={glyphW} quat={P.qFace} size={4.2} />
        <Phone position={pos} quaternion={quat} tex={tex} />
      </DarkStudio>
      <Post focus={focus} range={11} bokeh={2.6} bloom={0.35} />
    </>
  );
};
export const ShotTap: React.FC = () => <Scene3D overlay={<Supers id="tap" />}><TapScene /></Scene3D>;

/* ======================= 4 · Scan — warm neutral, leaf shadows, white Review + Menu stand ======================= */
// The phone sits exactly where the Viewfinder composition's camera is, so what the screen shows is this scene.
export const vfPose = (t: number) => {
  const qr = qrWorld();
  const n = V(0, Math.sin(STAND.TILT), Math.cos(STAND.TILT)).applyAxisAngle(Y, VF_STAND_RY);
  const lock = tween(t, 2.1, 2.7);
  const dist = 25 - tween(t, 0, 2.5) * 8.5;
  const d = drift(t, 0.55 * (1 - 0.85 * lock), 3.1);
  const pos = qr.clone().addScaledVector(n, dist).add(V(0.6 + d[0], 3.2 + d[1], d[2]));
  const target = qr.clone().add(V(d[0] * 0.35, d[1] * 0.35, 0));
  return { pos, target, roll: d[0] * 0.012 };
};
const ScanScene: React.FC = () => {
  const { t, f } = useLocal();
  const B = BEATS.scan;
  const tex = useScreenTexture(screenSrc('scan', f), screenSrc('scan', f + 1));
  const vf = vfPose(t);
  // phone: back camera looks at the QR; its screen faces us. After the menu opens, it tilts toward the viewer.
  const back = vf.target.clone().sub(vf.pos).normalize();
  const eye0 = vf.pos.clone().addScaledVector(back, -10);
  const q0 = facing(vf.pos, eye0, V(Math.sin(vf.roll), Math.cos(vf.roll), 0));
  const read = tween(t, B.menuUp - 0.2, B.menuUp + 1.2, 0, 1, easeIO);
  const right = V(1, 0, 0).applyQuaternion(q0), up = V(0, 1, 0).applyQuaternion(q0), front = V(0, 0, 1).applyQuaternion(q0);
  const camA = vf.pos.clone().addScaledVector(front, 36).addScaledVector(right, -17).addScaledVector(up, 6);
  const camB = vf.pos.clone().addScaledVector(front, 39).addScaledVector(right, -6.5).addScaledVector(up, 1);
  const cam = lerpV(camA, camB, read);
  const pos = lerpV(vf.pos, vf.pos.clone().add(V(0, -1.5, 3)), read);
  const quat = slerpQ(q0, facing(pos, cam.clone().add(V(0, 2, 0))), read * 0.8);
  const camT = lerpV(vf.pos.clone().lerp(qrWorld(), 0.45).addScaledVector(right, -3), pos.clone().addScaledVector(right, -6.2), read);
  return (
    <>
      <CamAt pos={cam} target={camT} fov={30} />
      <WarmStudio>
        <Stand finish="white" design="menu" rotation-y={VF_STAND_RY} />
        <Cup position={[-26, 0, -8]} />
        <Phone position={pos} quaternion={quat} tex={tex} />
      </WarmStudio>
      <Post focus={lerpV(lerpV(qrWorld(), pos, 0.55), pos, read)} range={10} bokeh={2.4} vignette={0.35} bloom={0.12} />
    </>
  );
};
export const ShotScan: React.FC = () => <Scene3D overlay={<Supers id="scan" />}><ScanScene /></Scene3D>;

/* ======================= 5 · Table ordering — guest phone at the table, server tablet at the counter ======================= */
const GuestPhone: React.FC<{ offset: number; late?: boolean }> = ({ offset, late }) => {
  const { t, f } = useLocal(offset);
  const tex = useScreenTexture(screenSrc('order', f), screenSrc('order', f + 1));
  const lt = t - offset;
  const tiltBack = THREE.MathUtils.degToRad(30);
  const P0 = V(0, 19, 14);
  const frontDir = V(0, Math.sin(tiltBack), Math.cos(tiltBack));
  const push = tween(lt, 0, late ? 6.2 : 7.6, 0, 1, easeIO);
  const cam = P0.clone().addScaledVector(frontDir, (late ? 40 : 39) - push * 3).add(V(-6.2, 0, 0));
  const d = drift(t, 0.12, late ? 5 : 1);
  const pos = P0.clone().add(V(...d));
  const quat = facing(pos, cam.clone().add(V(-5, 1.5, 0)), V(0, Math.cos(tiltBack), -Math.sin(tiltBack)).lerp(Y, 0.5).normalize());
  const target = P0.clone().add(V(-6.6, 0, 0));
  return (
    <>
      <CamAt pos={cam} target={target} fov={28} />
      <Cafe>
        <Stand finish="black" design="menu" position={[-30, 0, -22]} rotation-y={0.5} />
        <Cup position={[20, 0, -8]} />
        <Phone position={pos} quaternion={quat} tex={tex} />
      </Cafe>
      <Post focus={pos} range={7} bokeh={3.4} vignette={0.45} bloom={0.25} />
    </>
  );
};
const counterTablet = { pos: V(6, 12.6, -0.6), rot: new THREE.Euler(-0.36, 0, 0) };
const CounterTablet: React.FC<{ offset: number; dir: string; keys: [number, THREE.Vector3, THREE.Vector3][]; focusOn?: THREE.Vector3 }> = ({ offset, dir, keys, focusOn }) => {
  const { t, f } = useLocal(offset);
  const tex = useScreenTexture(screenSrc(dir, f), screenSrc(dir, f + 1));
  const lt = t - offset;
  let pos = keys[0][1], target = keys[0][2];
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, pa, qa] = keys[i], [tb, pb, qb] = keys[i + 1];
    if (lt >= ta) { const k = tween(lt, ta, tb, 0, 1, easeIO); pos = lerpV(pa, pb, k); target = lerpV(qa, qb, k); }
  }
  const d = drift(t, 0.25, 4);
  return (
    <>
      <CamAt pos={pos.clone().add(V(...d))} target={target} fov={28} />
      <Cafe>
        <group position={[counterTablet.pos.x, 0, 0]}><TabletStand position={[0, 0, -2]} /></group>
        <Tablet position={counterTablet.pos} rotation={counterTablet.rot} tex={tex} />
        <Stand finish="white" design="menu" position={[27, 0, 10]} rotation-y={-0.4} />
        <Plant position={[52, 0, -30]} scale={0.6} />
      </Cafe>
      <Post focus={focusOn ?? counterTablet.pos} range={12} bokeh={2.4} vignette={0.45} bloom={0.25} />
    </>
  );
};
export const ShotOrder: React.FC = () => {
  const { fps } = useVideoConfig(), B = BEATS.order;
  const s = (x: number) => Math.round(x * fps);
  return (
    <Scene3D overlay={<Supers id="order" />}>
      <Sequence durationInFrames={s(B.cutTablet)} layout="none"><GuestPhone offset={0} /></Sequence>
      <Sequence from={s(B.cutTablet)} durationInFrames={s(B.cutPhone - B.cutTablet)} layout="none">
        <CounterTablet offset={B.cutTablet} dir="order-tablet" keys={[
          [0, V(-10, 27, 68), V(-2, 12, 0)],
          [1.4, V(-3, 21, 59), V(-2.5, 12.5, 0)],
          [5.0, V(-2, 19.5, 55), V(-2.5, 12.6, 0)]
        ]} />
      </Sequence>
      <Sequence from={s(B.cutPhone)} layout="none"><GuestPhone offset={B.cutPhone} late /></Sequence>
    </Scene3D>
  );
};

/* ======================= 6 · Owner app — the real dashboard on the counter tablet ======================= */
export const ShotOwner: React.FC = () => {
  // chart centre on the tablet (busiest hours card, after the 232 px scroll): css (484, 120) → tablet-local cm
  const chart = V((484 / 1180 - 0.5) * TABLET.SW, (0.5 - 120 / 820) * TABLET.SH, TABLET.D / 2).applyEuler(counterTablet.rot).add(counterTablet.pos);
  const mid = counterTablet.pos.clone();
  return (
    <Scene3D overlay={<Supers id="owner" />}>
      <CounterTablet offset={0} dir="dash" focusOn={mid} keys={[
        [0, V(30, 26, 58), V(0, 12, 0)],
        [3.0, V(-2, 20, 46), V(-4.2, 13, 0)],
        [5.6, V(-2, 20, 44), V(-4.2, 13, 0)],
        [8.4, chart.clone().add(V(-8, 3, 33)), chart.clone().add(V(-8.5, 0, 0))],
        [12, chart.clone().add(V(-7.5, 2.8, 31)), chart.clone().add(V(-8.2, 0, 0))]
      ]} />
    </Scene3D>
  );
};

/* ======================= 7 · Done for you — lime studio ======================= */
const Chip: React.FC<{ text: string; at: number; out: number; x: number; y: number }> = ({ text, at, out, x, y }) => {
  const { opacity, y: dy } = useInOut(at, out, 0.4);
  return <div style={{ position: 'absolute', left: x, top: y + dy, opacity, padding: '9px 16px', borderRadius: 99, background: C.bg, color: C.lime, font: `600 17px ${MONO}`, letterSpacing: '0.1em' }}>{text}</div>;
};
const SetupPhone: React.FC = () => {
  const { t, f } = useLocal();
  const tex = useScreenTexture(screenSrc('setup-phone', f), screenSrc('setup-phone', f + 1));
  const k = tween(t, 0, 6.6, 0, 1, easeIO);
  const pos = V(0, 19 + Math.sin(t * 0.9) * 0.25, 0);
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.05, 0.3 - k * 0.42, 0.0));
  return (
    <>
      <CamAt pos={V(0, 17, 52 - k * 3)} target={V(0, 15.5, 0)} fov={26} />
      <LimeStudio back={-40}>
        <Phone position={pos} quaternion={quat} tex={tex} />
      </LimeStudio>
      <Post focus={pos} range={20} bokeh={1.2} vignette={0.2} bloom={0.08} />
    </>
  );
};
const SetupTablet: React.FC<{ offset: number }> = ({ offset }) => {
  const { t, f } = useLocal(offset);
  const tex = useScreenTexture(screenSrc('setup-tablet', f), screenSrc('setup-tablet', f + 1));
  const lt = t - offset;
  const k = tween(lt, 0, 3.4, 0, 1, easeIO);
  const pos = V(0, 21, 0);
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, -0.22 + k * 0.16, 0));
  return (
    <>
      <CamAt pos={V(0, 18, 62 - k * 3)} target={V(0, 17, 0)} fov={30} />
      <LimeStudio back={-40}>
        <Tablet position={pos} quaternion={quat} tex={tex} />
      </LimeStudio>
      <Post focus={pos} range={20} bokeh={1.2} vignette={0.2} bloom={0.08} />
    </>
  );
};
export const ShotSetup: React.FC = () => {
  const { fps } = useVideoConfig(), B = BEATS.setup;
  return (
    <Scene3D overlay={<>
      <Chip text="BEFORE" at={0.3} out={B.gbpAfter + 0.3} x={1190} y={180} />
      <Chip text="AFTER" at={B.gbpAfter + 0.5} out={B.cutWeb - 0.1} x={1190} y={180} />
      <Supers id="setup" dark />
    </>}>
      <Sequence durationInFrames={Math.round(B.cutMenu * fps)} layout="none"><SetupPhone /></Sequence>
      <Sequence from={Math.round(B.cutMenu * fps)} layout="none"><SetupTablet offset={B.cutMenu} /></Sequence>
    </Scene3D>
  );
};

/* ======================= 8 · Solo — top-down café, five stands land, price card ======================= */
const Table: React.FC<JSX.IntrinsicElements['group']> = props => {
  const wood = woodTex('table-top', '#9c7a5a', 512, 512);
  return (
    <group {...props}>
      <mesh position={[0, 73.5, 0]} castShadow receiveShadow><boxGeometry args={[70, 3, 70]} /><meshPhysicalMaterial map={wood} roughness={0.5} clearcoat={0.3} /></mesh>
      <mesh position={[0, 36, 0]} castShadow><cylinderGeometry args={[3, 3, 72, 16]} /><meshStandardMaterial color="#1b1b1c" roughness={0.4} metalness={0.6} /></mesh>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow><cylinderGeometry args={[24, 24, 1.6, 40]} /><meshStandardMaterial color="#1b1b1c" roughness={0.4} metalness={0.6} /></mesh>
      {[-1, 1].map(s => (
        <group key={s} position={[0, 0, s * 52]} rotation-y={s > 0 ? 0 : Math.PI}>
          <mesh position={[0, 45, 0]} castShadow receiveShadow><boxGeometry args={[40, 2, 38]} /><meshStandardMaterial color="#4a4038" roughness={0.55} /></mesh>
          <mesh position={[0, 72, 18]} castShadow><boxGeometry args={[38, 14, 1.4]} /><meshStandardMaterial color="#4a4038" roughness={0.55} /></mesh>
          {[-17, 17].map(x => <mesh key={x} position={[x, 58, 18]}><cylinderGeometry args={[0.9, 0.9, 28, 8]} /><meshStandardMaterial color="#1b1b1c" /></mesh>)}
          {[[-17, -17], [17, -17], [-17, 17], [17, 17]].map(([x, z], i) => <mesh key={i} position={[x, 22, z]}><cylinderGeometry args={[1.2, 1.2, 44, 8]} /><meshStandardMaterial color="#1b1b1c" /></mesh>)}
        </group>
      ))}
    </group>
  );
};
const Counter: React.FC<JSX.IntrinsicElements['group']> = props => (
  <group {...props}>
    <mesh position={[0, 50, 0]} castShadow receiveShadow><boxGeometry args={[220, 100, 60]} /><meshStandardMaterial color="#e6e1d8" roughness={0.7} /></mesh>
    <mesh position={[0, 101.5, 0]} castShadow receiveShadow><boxGeometry args={[228, 3, 66]} /><meshPhysicalMaterial color="#2a2623" roughness={0.3} clearcoat={0.6} /></mesh>
    <group position={[40, 103, -8]}><TabletStand scale={1} /><Tablet position={[0, 12.6, 1.4]} rotation={[-0.36, 0, 0]} /></group>
    <Cup position={[-60, 103, -10]} />
  </group>
);
const TABLES: [number, number][] = [[-120, -15], [-5, -15], [-120, 115], [-5, 115]];
const LANDING = [
  ...TABLES.map(([x, z], i) => ({ p: [x + [4, -3, 2, -4][i], 75, z + 8], ry: [0.18, -0.12, 0.22, -0.08][i] })),
  { p: [-50, 103, -130], ry: 0.05 } // the cashier
];
const SoloScene: React.FC = () => {
  const { t } = useLocal();
  const B = BEATS.solo;
  const floor = woodTex('floor-planks', '#7d6450', 1024, 1024, 8);
  floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(8, 8);
  const k = tween(t, 0, 10, 0, 1, easeIO);
  // high oblique over the room; the café sits left of centre so the price card has the right side
  const C0 = V(-60, 60, -10);
  const cam = V(-200 + k * 60, 640 - k * 70, 540 - k * 60);
  const fwd = C0.clone().sub(cam), dist = fwd.length();
  const right = fwd.clone().cross(Y).normalize();
  const target = C0.clone().addScaledVector(right, dist * (0.2 - 0.02 * k));
  return (
    <>
      <CamAt pos={cam} target={target} fov={30} />
      <Cafe wall={false} fog={false}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]} receiveShadow><planeGeometry args={[2400, 2400]} /><meshStandardMaterial map={floor} roughness={0.65} /></mesh>
        {TABLES.map(([x, z], i) => <Table key={i} position={[x, 0, z]} />)}
        <Counter position={[-20, 0, -160]} />
        <Plant position={[-230, 0, -150]} scale={1.4} /><Plant position={[110, 0, -170]} scale={1.1} />
        <mesh position={[0, 150, -200]} receiveShadow><planeGeometry args={[2400, 300]} /><meshStandardMaterial color="#cdbfae" roughness={0.9} /></mesh>
        {LANDING.map((s, i) => {
          const at = B.land[i];
          const u = (t - (at - 0.42)) / 0.42;
          if (u < 0) return null;
          const fall = u < 1 ? (1 - u * u) * 55 : Math.abs(Math.sin(Math.min(1, (t - at) / 0.28) * Math.PI)) * 1.6 * Math.exp(-(t - at) * 5);
          const finish = i % 2 ? 'white' : 'black';
          return (
            <group key={i}>
              <Stand finish={finish} design="menu" position={[s.p[0], s.p[1] + fall, s.p[2]]} rotation-y={s.ry} />
              <Ripple t={t} at={at} pos={V(s.p[0], s.p[1] + 0.3, s.p[2])} quat={new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2)} size={22} />
            </group>
          );
        })}
      </Cafe>
      <hemisphereLight args={['#fff1dc', '#4a3220', 1.1]} />
      <directionalLight position={[-80, 300, 160]} intensity={2.4} color="#fff0da" castShadow shadow-mapSize={[Q.shadow, Q.shadow]} shadow-camera-left={-300} shadow-camera-right={300} shadow-camera-top={300} shadow-camera-bottom={-300} shadow-bias={-0.0005} />
      <Post focus={V(20, 75, 10)} range={260} bokeh={1.2} vignette={0.45} bloom={0.3} />
    </>
  );
};
const PriceCard: React.FC = () => {
  const B = BEATS.solo;
  const a = useInOut(B.card, 99, 0.8), b = useInOut(B.card + 0.3, 99, 0.8), c = useInOut(B.card + 0.6, 99, 0.8);
  return (
    <div style={{ position: 'absolute', right: 110, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
      <div style={{ opacity: a.opacity, transform: `translateY(${a.y}px)`, width: 640, padding: '40px 44px', borderRadius: 32, background: 'rgba(10,10,11,.86)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08), 0 30px 80px rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 17px ${MONO}`, letterSpacing: '0.08em' }}><span style={{ color: C.lime }}>SOLO PACKAGE</span><span style={{ color: C.m3 }}>1 LOCATION</span></div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 104, lineHeight: 0.92, letterSpacing: '-0.06em', color: C.fg }}>Solo.<br /><span style={{ color: C.lime }}>₱3,000.</span></div>
        <div style={{ opacity: b.opacity, transform: `translateY(${b.y}px)`, font: `500 21px ${MONO}`, letterSpacing: '0.04em', color: C.m1, lineHeight: 1.5 }}>5 stands · Google Review + Live Menu · Tables and cashier</div>
        <div style={{ opacity: c.opacity, font: `500 15px ${MONO}`, letterSpacing: '0.08em', color: C.m3 }}>ONE-TIME · + TAPFOUR APP ₱299/MO</div>
      </div>
    </div>
  );
};
export const ShotSolo: React.FC = () => <Scene3D overlay={<PriceCard />}><SoloScene /></Scene3D>;
