// The 3D shots. Each is a pure function of the shot-local time t (seconds); timings come from timeline.ts.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene3D } from '../three/Scene';
import { Stand, Phone, Tablet, TabletStand, STAND, PHONE, TABLET, standPoint, ART, drift, tween, useScreenTexture, screenSrc, LIME } from '../three/kit';
import { DarkStudio, Post } from '../three/studios';
import { CamAt, VF_STAND_RY, qrWorld } from './Stills';
import { SUPERS, BEATS, ShotId } from '../timeline';
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

/* ======================= 2 · Reveal — dark studio, black + white Review + Menu stands ======================= */
export const ShotReveal: React.FC = () => {
  const { t } = useLocal();
  const k = tween(t, 0, 5.6, 0, 1, easeIO);
  const pos = lerpV(V(-22, 16, 60), V(-2, 12, 55), k), target = lerpV(V(0, 8.8, 0), V(3, 8.2, 0), k);
  return (
    <Scene3D overlay={<Supers id="reveal" />}>
      <CamAt pos={pos} target={target} fov={26} />
      <DarkStudio>
        <Stand finish="black" design="menu" position={[2, 0, 3]} rotation-y={-0.12} />
        <Stand finish="white" design="menu" position={[20, 0, -8]} rotation-y={-0.3} />
      </DarkStudio>
      <Post focus={V(8, 8, -2)} range={30} bokeh={1.5} vignette={0.4} bloom={0.12} />
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
    // The mark is ~6 cm above the table, so the phone taps in landscape: its back flat on the acrylic, the top end
    // (where the NFC antenna is) over the mark, the body running left across the face and the screen toward us.
    const up = r.clone(), front = n.clone(), right = up.clone().cross(front).normalize();
    const qC = basis(right, up, front);
    const cC = glyph.clone().addScaledVector(n, PHONE.D / 2 + 0.08).addScaledVector(up, -(PHONE.H / 2 - 2.2));
    const q0 = qC.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -0.5));
    const c0 = cC.clone().add(V(14, 12, 18));
    const camEnd = V(-0.5, 21.5, 71);
    const H = V(6.2, 17, 24);
    const qH = facing(H, camEnd.clone().add(V(-2, 5, 0))).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -0.05));
    return { glyph, n, u, qFace: new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -tilt), qC, cC, q0, c0, H, qH, camEnd, front };
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

/* ======================= 4 · Scan — dark studio, white Review + Menu stand ======================= */
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
  const camT = lerpV(vf.pos.clone().lerp(qrWorld(), 0.45).addScaledVector(right, -10), pos.clone().addScaledVector(right, -8.5), read);
  return (
    <>
      <CamAt pos={cam} target={camT} fov={30} />
      <DarkStudio>
        <Stand finish="white" design="menu" rotation-y={VF_STAND_RY} />
        <Phone position={pos} quaternion={quat} tex={tex} />
      </DarkStudio>
      <Post focus={lerpV(lerpV(qrWorld(), pos, 0.55), pos, read)} range={10} bokeh={2.4} vignette={0.35} bloom={0.12} />
    </>
  );
};
export const ShotScan: React.FC = () => <Scene3D overlay={<Supers id="scan" />}><ScanScene /></Scene3D>;

/* ======================= 5 · Table ordering — the guest's phone, then the staff tablet ======================= */
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
      <DarkStudio>
        <Stand finish="black" design="menu" position={[-4, 0, -30]} rotation-y={0.15} />
        <Phone position={pos} quaternion={quat} tex={tex} />
      </DarkStudio>
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
      <DarkStudio>
        <group position={[counterTablet.pos.x, 0, 0]}><TabletStand position={[0, 0, -2]} /></group>
        <Tablet position={counterTablet.pos} rotation={counterTablet.rot} tex={tex} />
        <Stand finish="white" design="menu" position={[27, 0, 10]} rotation-y={-0.4} />
      </DarkStudio>
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

/* ======================= 7 · Done for you — dark studio ======================= */
const Chip: React.FC<{ text: string; at: number; out: number; x: number; y: number }> = ({ text, at, out, x, y }) => {
  const { opacity, y: dy } = useInOut(at, out, 0.4);
  return <div style={{ position: 'absolute', left: x, top: y + dy, opacity, padding: '9px 16px', borderRadius: 99, background: 'rgba(242,240,235,.08)', boxShadow: 'inset 0 0 0 1px rgba(242,240,235,.14)', color: C.lime, font: `600 17px ${MONO}`, letterSpacing: '0.1em' }}>{text}</div>;
};
const SetupPhone: React.FC = () => {
  const { t, f } = useLocal();
  const tex = useScreenTexture(screenSrc('setup-phone', f), screenSrc('setup-phone', f + 1));
  const k = tween(t, 0, 6.6, 0, 1, easeIO);
  const pos = V(0, 19 + Math.sin(t * 0.9) * 0.25, 0);
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.05, 0.3 - k * 0.42, 0.0));
  return (
    <>
      <CamAt pos={V(-2, 20, 52 - k * 3)} target={V(-2, 19, 0)} fov={26} />
      <DarkStudio>
        <Phone position={pos} quaternion={quat} tex={tex} />
      </DarkStudio>
      <Post focus={pos} range={20} bokeh={1.2} vignette={0.4} bloom={0.12} />
    </>
  );
};
const SetupTablet: React.FC<{ offset: number }> = ({ offset }) => {
  const { t, f } = useLocal(offset);
  const tex = useScreenTexture(screenSrc('setup-tablet', f), screenSrc('setup-tablet', f + 1));
  const lt = t - offset;
  const k = tween(lt, 0, 3.4, 0, 1, easeIO);
  const pos = V(5, 21, 0);
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, -0.22 + k * 0.16, 0));
  return (
    <>
      <CamAt pos={V(0, 22, 62 - k * 3)} target={V(0, 21, 0)} fov={30} />
      <DarkStudio>
        <Tablet position={pos} quaternion={quat} tex={tex} />
      </DarkStudio>
      <Post focus={pos} range={20} bokeh={1.2} vignette={0.4} bloom={0.12} />
    </>
  );
};
export const ShotSetup: React.FC = () => {
  const { fps } = useVideoConfig(), B = BEATS.setup;
  return (
    <Scene3D overlay={<>
      <Chip text="BEFORE" at={0.3} out={B.gbpAfter + 0.3} x={1190} y={180} />
      <Chip text="AFTER" at={B.gbpAfter + 0.5} out={B.cutWeb - 0.1} x={1190} y={180} />
      <Supers id="setup" />
    </>}>
      <Sequence durationInFrames={Math.round(B.cutMenu * fps)} layout="none"><SetupPhone /></Sequence>
      <Sequence from={Math.round(B.cutMenu * fps)} layout="none"><SetupTablet offset={B.cutMenu} /></Sequence>
    </Scene3D>
  );
};

/* ======================= 8 · Solo — five Review + Menu stands land in a row (four tables + the cashier) ======================= */
// Table 1–4 alternate black and white; the cashier's is white (the seed's Solo set). A compact two-row group.
const SOLO: { x: number; z: number; ry: number; finish: 'black' | 'white' }[] = [
  { x: -24, z: 4, ry: -0.2, finish: 'black' }, { x: -12, z: -14, ry: -0.16, finish: 'white' }, { x: 0, z: 6, ry: -0.14, finish: 'black' },
  { x: 12, z: -14, ry: -0.1, finish: 'white' }, { x: 24, z: 4, ry: -0.08, finish: 'white' }
];
const SoloScene: React.FC = () => {
  const { t } = useLocal();
  const B = BEATS.solo;
  const k = tween(t, 0, 10, 0, 1, easeIO);
  const side = tween(t, B.card - 0.6, B.card + 1.2, 0, 1, easeIO); // the camera slides so the row sits left of the price card
  const cam = lerpV(V(-20 + k * 8, 30, 98 - k * 6), V(-2, 38, 122), side);
  const target = lerpV(V(0, 6, -4), V(23, 5, -4), side);
  return (
    <>
      <CamAt pos={cam} target={target} fov={30} />
      <DarkStudio>
        {SOLO.map((s, i) => {
          const at = B.land[i];
          const u = (t - (at - 0.36)) / 0.36;
          if (u < 0) return null;
          // a short drop, then a small settle on the floor
          const fall = u < 1 ? (1 - u * u) * 7 : Math.abs(Math.sin(Math.min(1, (t - at) / 0.2) * Math.PI)) * 0.35 * Math.exp(-(t - at) * 6);
          return (
            <group key={i}>
              <Stand finish={s.finish} design="menu" position={[s.x, fall, s.z]} rotation-y={s.ry} />
              <Ripple t={t} at={at} pos={V(s.x, 0.05, s.z - 2)} quat={new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2)} size={6} />
            </group>
          );
        })}
      </DarkStudio>
      <Post focus={V(0, 7, -4)} range={70} bokeh={1} vignette={0.45} bloom={0.18} />
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
