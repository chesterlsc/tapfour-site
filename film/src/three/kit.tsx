// 3D kit for the film. Units are centimetres. Every object is a pure function of the current frame.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture, PerspectiveCamera } from '@react-three/drei';
import { continueRender, delayRender, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { easeIO, clamp } from '../brand';
import { shot, ShotId } from '../timeline';

/* ---------- shapes ---------- */
export function roundedRect(w: number, h: number, rTop: number, rBottom = rTop, cx = 0, cy = 0) {
  const s = new THREE.Shape(), x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  s.moveTo(x0 + rBottom, y0);
  s.lineTo(x1 - rBottom, y0);
  if (rBottom) s.quadraticCurveTo(x1, y0, x1, y0 + rBottom);
  s.lineTo(x1, y1 - rTop);
  if (rTop) s.quadraticCurveTo(x1, y1, x1 - rTop, y1);
  s.lineTo(x0 + rTop, y1);
  if (rTop) s.quadraticCurveTo(x0, y1, x0, y1 - rTop);
  s.lineTo(x0, y0 + rBottom);
  if (rBottom) s.quadraticCurveTo(x0, y0, x0 + rBottom, y0);
  return s;
}
// Squircle-ish corners (continuous curvature) for devices: bezier with a longer handle.
export function squircleRect(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2, k = r * 1.28, c = r * 0.18;
  s.moveTo(x0 + k, y0);
  s.lineTo(x1 - k, y0); s.bezierCurveTo(x1 - c, y0, x1, y0 + c, x1, y0 + k);
  s.lineTo(x1, y1 - k); s.bezierCurveTo(x1, y1 - c, x1 - c, y1, x1 - k, y1);
  s.lineTo(x0 + k, y1); s.bezierCurveTo(x0 + c, y1, x0, y1 - c, x0, y1 - k);
  s.lineTo(x0, y0 + k); s.bezierCurveTo(x0, y0 + c, x0 + c, y0, x0 + k, y0);
  return s;
}
// ShapeGeometry with 0..1 UVs across its bounding box (for artwork and screens).
export function shapeGeo(shape: THREE.Shape, segments = 24) {
  const g = new THREE.ShapeGeometry(shape, segments);
  g.computeBoundingBox();
  const b = g.boundingBox!, p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
  uv.needsUpdate = true;
  return g;
}

/* ---------- textures ---------- */
export const useArt = (name: string) => {
  const t = useTexture(staticFile(`art/${name}`));
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
};

// One image per frame from public/screens/<dir>/NNNN.jpg (pre-rendered screen compositions).
const imgCache = new Map<string, Promise<HTMLImageElement>>();
const loadImg = (src: string) => {
  if (!imgCache.has(src)) {
    imgCache.set(src, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));
    if (imgCache.size > 12) imgCache.delete(imgCache.keys().next().value!);
  }
  return imgCache.get(src)!;
};
export const screenSrc = (dir: string, frame: number) => staticFile(`screens/${dir}/${String(Math.max(0, frame)).padStart(4, '0')}.jpg`);
// Each screen sequence is as long as its shot, but a shot keeps playing through the dissolve into the next one,
// so hold the last rendered frame instead of requesting frames past the end (404 → blank screen in a fresh tab).
const SCREEN_SHOT: Record<string, ShotId> = { tap: 'tap', scan: 'scan', order: 'order', 'order-tablet': 'order', dash: 'owner', 'setup-phone': 'setup', 'setup-tablet': 'setup' };
export function useScreen(dir: string, frame: number) {
  const { fps } = useVideoConfig();
  const s = shot(SCREEN_SHOT[dir]), last = Math.round((s.end - s.start) * fps) - 1;
  return useScreenTexture(screenSrc(dir, Math.min(last, frame)), screenSrc(dir, Math.min(last, frame + 1)));
}
export function useScreenTexture(src: string | null, next?: string | null) {
  const { advance } = useThree();
  const tex = useMemo(() => { const t = new THREE.Texture(); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }, []);
  useLayoutEffect(() => {
    if (!src) return;
    const h = delayRender('screen ' + src, { timeoutInMilliseconds: 60000 });
    let live = true;
    loadImg(src).then(img => { if (!live) return; tex.image = img; tex.needsUpdate = true; advance(performance.now()); continueRender(h); }, () => continueRender(h));
    if (next) loadImg(next).catch(() => {});
    return () => { live = false; continueRender(h); };
  }, [src]);
  return tex;
}

/* ---------- materials ---------- */
export const LIME = new THREE.Color('#c8f23c');

/* ---------- L-stand (TAP4.1), matched to the product renders ----------
   One 3 mm sheet of glossy acrylic: the printed 10 × 15 cm face stands at the FRONT and leans back 8°; a tight bend
   at its foot turns the sheet backwards into a 6.2 cm foot that runs under the face along the table. Stand-local
   axes: +z faces the viewer, the bend's outer edge touches the table at z ≈ 0, the foot runs to z = −FOOT. */
export const STAND = { W: 10, H: 15, T: 0.25, FOOT: 6.2, R: 0.7, TILT: THREE.MathUtils.degToRad(8), CORNER: 0.6, FOOT_R: 0.6, EDGE: 0.05 };
// The bend's mid-surface: centre of curvature above the table; phi 0 = along the foot (heading +z), END = up the face.
const BEND_END = Math.PI / 2 + STAND.TILT;
const bendAt = (phi: number) => {
  const { T, R } = STAND, Rc = R + T / 2;
  // outward normal (the printed / underside surface): (-cos phi, sin phi) in (y, z)
  return { y: T / 2 + Rc - Rc * Math.cos(phi), z: Rc * Math.sin(phi), ny: -Math.cos(phi), nz: Math.sin(phi) };
};
const bendGeometry = () => {
  const { W, T } = STAND, N = 18;
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  const groups: [number, number, number][] = [];
  const strip = (fn: (phi: number, j: 0 | 1) => [number[], number[]], mat: number, flip = false) => {
    const start = idx.length, base = pos.length / 3;
    for (let i = 0; i <= N; i++) for (const j of [0, 1] as const) { const [p, n] = fn(BEND_END * i / N, j); pos.push(...p); nor.push(...n); }
    for (let i = 0; i < N; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    if (flip) for (let k = start; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
    groups.push([start, idx.length - start, mat]);
  };
  // outer (printed side / underside), inner, and the two cut edges
  strip((phi, j) => { const a = bendAt(phi), o = T / 2; return [[j ? W / 2 : -W / 2, a.y + a.ny * o, a.z + a.nz * o], [0, a.ny, a.nz]]; }, 0);
  strip((phi, j) => { const a = bendAt(phi), o = -T / 2; return [[j ? W / 2 : -W / 2, a.y + a.ny * o, a.z + a.nz * o], [0, -a.ny, -a.nz]]; }, 0, true);
  strip((phi, j) => { const a = bendAt(phi), o = j ? T / 2 : -T / 2; return [[-W / 2, a.y + a.ny * o, a.z + a.nz * o], [-1, 0, 0]]; }, 1);
  strip((phi, j) => { const a = bendAt(phi), o = j ? T / 2 : -T / 2; return [[W / 2, a.y + a.ny * o, a.z + a.nz * o], [1, 0, 0]]; }, 1, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  g.setIndex(idx);
  groups.forEach(([s, c, m]) => g.addGroup(s, c, m));
  return g;
};
const faceBase = () => { const e = bendAt(BEND_END); return new THREE.Vector3(0, e.y, e.z); };

export type Finish = 'black' | 'white';
export type Design = 'review' | 'menu';
export const Stand: React.FC<React.JSX.IntrinsicElements['group'] & { finish: Finish; design: Design; shadow?: boolean }> = ({ finish, design, shadow = true, ...props }) => {
  const art = useArt(`${design}-${finish}.png`);
  const { W, H, T, FOOT, TILT, CORNER, FOOT_R, EDGE: b } = STAND;
  const parts = useMemo(() => {
    const faceH = H;
    // polished, softly rounded cut edges (a small bevel all round), like the acrylic in the renders
    const sheet = (shape: THREE.Shape) => {
      const g = new THREE.ExtrudeGeometry(shape, { depth: T - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 20 });
      g.translate(0, 0, -(T / 2 - b));
      return g;
    };
    const face = sheet(roundedRect(W - 2 * b, faceH - b, CORNER - b, 0, 0, (faceH - b) / 2));
    // the foot, drawn in its own plane (y = depth back from the bend), then laid flat pointing backwards
    const foot = sheet(roundedRect(W - 2 * b, FOOT - b, FOOT_R - b, 0, 0, (FOOT - b) / 2));
    const artGeo = shapeGeo(roundedRect(W, faceH, CORNER, 0, 0, faceH / 2), 20);
    return { bend: bendGeometry(), face, foot, artGeo };
  }, []);
  const black = finish === 'black';
  const mats = useMemo(() => {
    // glossy acrylic: piano-black with a clear lacquer; white is a milky, satin-gloss sheet (see the renders)
    const body = new THREE.MeshPhysicalMaterial(black
      ? { color: '#020203', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.015, reflectivity: 0.7 }
      : { color: '#f6f6f0', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
    // cut edges: the renders show a thin lime line on the black sheet's edge, a pale green-white edge on the white one
    const edge = new THREE.MeshPhysicalMaterial(black
      ? { color: '#0c0d0a', emissive: LIME, emissiveIntensity: 0.025, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15 }
      : { color: '#e4e5dc', roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    const artM = new THREE.MeshPhysicalMaterial(black
      ? { map: art, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.015, polygonOffset: true, polygonOffsetFactor: -2 }
      : { map: art, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, polygonOffset: true, polygonOffsetFactor: -2 });
    return { body, edge, artM, arr: [body, edge] };
  }, [finish, art]);
  const e = faceBase();
  return (
    <group {...props}>
      {/* foot and face start exactly where the bend ends; their rounded end edges sit just inside the bend */}
      <mesh geometry={parts.foot} material={mats.arr} rotation={[-Math.PI / 2, 0, 0]} position={[0, T / 2, 0]} castShadow={shadow} receiveShadow />
      <mesh geometry={parts.bend} material={mats.arr} castShadow={shadow} receiveShadow />
      <group position={e} rotation={[-TILT, 0, 0]}>
        <mesh geometry={parts.face} material={mats.arr} castShadow={shadow} receiveShadow />
        <mesh geometry={parts.artGeo} material={mats.artM} position={[0, 0, T / 2 + 0.004]} receiveShadow />
      </group>
    </group>
  );
};
// Where points on the artwork (u,v in 0..1, v from the top) sit in stand-local space, e.g. the NFC glyph or the QR.
export function standPoint(u: number, v: number, out = 0) {
  const { W, H, T, TILT } = STAND;
  const local = new THREE.Vector3((u - 0.5) * W, (1 - v) * H, T / 2 + out);
  return local.applyAxisAngle(new THREE.Vector3(1, 0, 0), -TILT).add(faceBase());
}
export const ART = { nfc: [0.5, 0.64], qr: [0.7575, 0.4825], g: [0.5, 0.46], gMenu: [0.25, 0.49] } as const;

/* ---------- devices: flagship proportions, thin bezels, no logos ---------- */
const deviceBody = (w: number, h: number, r: number, depth: number, bevel: number) => {
  const g = new THREE.ExtrudeGeometry(squircleRect(w - bevel * 2, h - bevel * 2, r - bevel), { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 8, curveSegments: 32 });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  return g;
};
// satin: no clearcoat and a slightly rougher frame and bezel glass. The tablet's long top edge otherwise catches the key
// spotlight as a pin-sharp highlight that bloom blows up into a sun over the status bar.
const useDeviceMats = (frame = '#55565b', satin = false) => useMemo(() => ({
  frame: new THREE.MeshPhysicalMaterial(satin ? { color: frame, metalness: 1, roughness: 0.4 } : { color: frame, metalness: 1, roughness: 0.28, clearcoat: 0.4 }),
  glass: new THREE.MeshPhysicalMaterial(satin ? { color: '#030304', roughness: 0.16 } : { color: '#030304', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.01 }),
  back: new THREE.MeshPhysicalMaterial({ color: '#232428', roughness: 0.38, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.35 }),
  lens: new THREE.MeshPhysicalMaterial({ color: '#050507', roughness: 0.02, metalness: 0.2, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.8 }),
  ring: new THREE.MeshPhysicalMaterial({ color: '#8a8c90', metalness: 1, roughness: 0.2 })
}), [frame, satin]);
const screenMat = (tex: THREE.Texture, glow = 1) => new THREE.MeshPhysicalMaterial({
  // anti-reflective cover glass: soft reflections of the softboxes, no blown hot spot over the UI
  color: '#000000', emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: glow, roughness: 1, specularIntensity: 0, clearcoat: 0.22, clearcoatRoughness: 0.05, toneMapped: false
});

export const PHONE = { W: 7.2, H: 15.2, D: 0.82, R: 1.05, SW: 6.84, SH: 14.83 }; // screen 393×852 css
export const Phone: React.FC<React.JSX.IntrinsicElements['group'] & { tex?: THREE.Texture | null; glow?: number }> = ({ tex, glow = 0.95, ...props }) => {
  const m = useDeviceMats();
  const { W, H, D, R, SW, SH } = PHONE;
  const g = useMemo(() => ({
    body: deviceBody(W, H, R, D, 0.2),
    screen: shapeGeo(squircleRect(SW, SH, R - 0.2), 32),
    island: shapeGeo(roundedRect(2.1, 0.62, 0.31, 0.31), 12),
    cam: new THREE.ExtrudeGeometry(squircleRect(3.4, 3.4, 0.9), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 20 })
  }), []);
  const sm = useMemo(() => tex ? screenMat(tex, glow) : m.glass, [tex, glow]);
  return (
    <group {...props}>
      <mesh geometry={g.body} material={[m.glass, m.frame]} castShadow receiveShadow />
      <mesh geometry={g.screen} material={sm} position={[0, 0, D / 2 + 0.003]} />
      <mesh geometry={g.island} material={m.glass} position={[0, SH / 2 - 0.62, D / 2 + 0.006]} />
      {/* back glass + generic camera island (no logos) */}
      <mesh position={[0, 0, -D / 2 - 0.002]} rotation={[0, Math.PI, 0]} geometry={useMemo(() => shapeGeo(squircleRect(W - 0.4, H - 0.4, R - 0.2), 24), [])} material={m.back} />
      <group position={[W / 2 - 2.05, H / 2 - 2.05, -D / 2]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={g.cam} material={m.back} />
        {[[-0.72, 0.72], [-0.72, -0.72], [0.8, 0]].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.2]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={m.ring}><cylinderGeometry args={[0.6, 0.62, 0.12, 40]} /></mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]} material={m.lens}><cylinderGeometry args={[0.46, 0.46, 0.06, 40]} /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

export const TABLET = { W: 25.4, H: 17.9, D: 0.63, R: 1.4, SW: 24.56, SH: 17.07 }; // screen 1180×820 css
export const Tablet: React.FC<React.JSX.IntrinsicElements['group'] & { tex?: THREE.Texture | null; glow?: number }> = ({ tex, glow = 1.12, ...props }) => {
  const m = useDeviceMats('#6d6f73', true);
  const { W, H, D, R, SW, SH } = TABLET;
  const g = useMemo(() => ({ body: deviceBody(W, H, R, D, 0.14), screen: shapeGeo(squircleRect(SW, SH, R - 0.35), 32), back: shapeGeo(squircleRect(W - 0.3, H - 0.3, R - 0.15), 24) }), []);
  const sm = useMemo(() => tex ? screenMat(tex, glow) : m.glass, [tex, glow]);
  return (
    <group {...props}>
      <mesh geometry={g.body} material={[m.glass, m.frame]} castShadow receiveShadow />
      <mesh geometry={g.screen} material={sm} position={[0, 0, D / 2 + 0.003]} />
      <mesh geometry={g.back} material={m.frame} position={[0, 0, -D / 2 - 0.002]} rotation={[0, Math.PI, 0]} />
    </group>
  );
};

// A slim counter stand for the tablet (bead-blasted aluminium): a round weighted base, one flat arm up to a round
// mount on the tablet's back. `mount` is the mount point in the stand's space.
export const TabletStand: React.FC<React.JSX.IntrinsicElements['group'] & { mount?: [number, number, number] }> = ({ mount = [0, 10.4, 1.3], ...props }) => {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#b4b6b9', metalness: 1, roughness: 0.34, clearcoat: 0.2 }), []);
  const arm = useMemo(() => {
    const a = new THREE.Vector3(0, 0.9, -1.8), b = new THREE.Vector3(...mount);
    const d = b.clone().sub(a), len = d.length();
    return { mid: a.clone().add(b).multiplyScalar(0.5), len, q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()) };
  }, [mount[0], mount[1], mount[2]]);
  const base = useMemo(() => new THREE.LatheGeometry([[0, 0], [7.2, 0], [7.5, 0.15], [7.6, 0.45], [7.3, 0.85], [0, 0.9]].map(([x, y]) => new THREE.Vector2(x, y)), 72), []);
  return (
    <group {...props}>
      <mesh geometry={base} material={mat} castShadow receiveShadow />
      <mesh material={mat} position={arm.mid} quaternion={arm.q} castShadow><boxGeometry args={[2.4, arm.len, 0.8]} /></mesh>
      <mesh material={mat} position={mount} rotation={[Math.PI / 2 - 0.36, 0, 0]} castShadow><cylinderGeometry args={[3.2, 3.2, 0.6, 48]} /></mesh>
    </group>
  );
};

/* ---------- camera rig: keyframes with long eased moves ---------- */
export type CamKey = { t: number; pos: [number, number, number]; target: [number, number, number]; fov?: number };
export function sampleKeys(keys: CamKey[], t: number) {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const k = easeIO((t - a.t) / (b.t - a.t));
      const L = (x: number[], y: number[]) => x.map((v, j) => v + (y[j] - v) * k) as [number, number, number];
      return { t, pos: L(a.pos, b.pos), target: L(a.target, b.target), fov: (a.fov ?? 30) + ((b.fov ?? 30) - (a.fov ?? 30)) * k };
    }
  }
  return keys[keys.length - 1];
}
// Smooth handheld drift (sum of slow sines), amplitude in cm.
export const drift = (t: number, amp = 0.15, seed = 0) => [
  amp * (Math.sin(t * 0.9 + seed) * 0.6 + Math.sin(t * 2.3 + seed * 2) * 0.3 + Math.sin(t * 5.1 + seed) * 0.1),
  amp * (Math.sin(t * 1.1 + seed * 3) * 0.6 + Math.sin(t * 2.9 + seed) * 0.3 + Math.sin(t * 4.7 + seed * 5) * 0.1),
  amp * (Math.sin(t * 0.7 + seed * 7) * 0.5)
] as [number, number, number];

export const Cam: React.FC<{ keys: CamKey[]; t: number; shake?: number; roll?: number }> = ({ keys, t, shake = 0, roll = 0 }) => {
  const ref = useRef<THREE.PerspectiveCamera>(null);
  const k = sampleKeys(keys, t);
  const d = drift(t, shake, 1.7);
  const pos: [number, number, number] = [k.pos[0] + d[0], k.pos[1] + d[1], k.pos[2] + d[2]];
  useLayoutEffect(() => {
    const c = ref.current!;
    c.position.set(...pos);
    c.up.set(Math.sin(roll), Math.cos(roll), 0);
    c.lookAt(k.target[0] + d[0] * 0.5, k.target[1] + d[1] * 0.5, k.target[2]);
    c.updateProjectionMatrix();
  });
  return <PerspectiveCamera ref={ref} makeDefault fov={k.fov ?? 30} near={0.5} far={4000} position={pos} />;
};

export const useT = () => { const f = useCurrentFrame(), { fps } = useVideoConfig(); return f / fps; };
export const tween = (t: number, a: number, b: number, from = 0, to = 1, e = easeIO) => interpolate(t, [a, b], [from, to], { ...clamp, easing: e });
