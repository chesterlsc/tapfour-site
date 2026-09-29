// 3D kit for the film. Units are centimetres. Every object is a pure function of the current frame.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture, PerspectiveCamera } from '@react-three/drei';
import { continueRender, delayRender, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { easeIO, clamp } from '../brand';

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

/* ---------- L-stand (TAP4.1): 10 × 15 cm face, 3 mm acrylic, bent foot, face leans back 8° ---------- */
export const STAND = { W: 10, H: 15, T: 0.3, FOOT: 6.2, R: 0.55, TILT: THREE.MathUtils.degToRad(8), CORNER: 0.85 };
const bendGeometry = () => {
  const { W, T, R, TILT } = STAND, N = 14, end = Math.PI / 2 - TILT, Rc = R + T / 2;
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  const at = (phi: number) => ({ y: T / 2 + Rc - Rc * Math.cos(phi), z: -Rc * Math.sin(phi), ny: Math.cos(phi), nz: -Math.sin(phi) });
  // strips: 0 top(front) surface, 1 bottom(back), 2 left side, 3 right side
  const addStrip = (fn: (phi: number, j: 0 | 1) => [number[], number[]]) => {
    const base = pos.length / 3;
    for (let i = 0; i <= N; i++) for (const j of [0, 1] as const) { const [p, n] = fn(end * i / N, j); pos.push(...p); nor.push(...n); }
    for (let i = 0; i < N; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  const groups: [number, number, number][] = [];
  const strip = (fn: (phi: number, j: 0 | 1) => [number[], number[]], mat: number, flip = false) => {
    const start = idx.length; addStrip(fn);
    if (flip) for (let k = start; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
    groups.push([start, idx.length - start, mat]);
  };
  strip((phi, j) => { const a = at(phi), o = T / 2; return [[j ? W / 2 : -W / 2, a.y + a.ny * o, a.z + a.nz * o], [0, a.ny, a.nz]]; }, 0, true);
  strip((phi, j) => { const a = at(phi), o = -T / 2; return [[j ? W / 2 : -W / 2, a.y + a.ny * o, a.z + a.nz * o], [0, -a.ny, -a.nz]]; }, 0);
  strip((phi, j) => { const a = at(phi), o = j ? T / 2 : -T / 2; return [[-W / 2, a.y + a.ny * o, a.z + a.nz * o], [-1, 0, 0]]; }, 1);
  strip((phi, j) => { const a = at(phi), o = j ? T / 2 : -T / 2; return [[W / 2, a.y + a.ny * o, a.z + a.nz * o], [1, 0, 0]]; }, 1, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  g.setIndex(idx);
  groups.forEach(([s, c, m]) => g.addGroup(s, c, m));
  return { g, endPoint: at(end) };
};

export type Finish = 'black' | 'white';
export type Design = 'review' | 'menu';
export const Stand: React.FC<JSX.IntrinsicElements['group'] & { finish: Finish; design: Design; shadow?: boolean }> = ({ finish, design, shadow = true, ...props }) => {
  const art = useArt(`${design}-${finish}.png`);
  const { W, H, T, FOOT, TILT, CORNER } = STAND;
  const parts = useMemo(() => {
    const bend = bendGeometry();
    const faceH = H - 0.4;
    const face = new THREE.ExtrudeGeometry(roundedRect(W, faceH, CORNER, 0, 0, faceH / 2), { depth: T, bevelEnabled: false, curveSegments: 16 });
    face.translate(0, 0, -T / 2);
    const foot = new THREE.ExtrudeGeometry(roundedRect(W, FOOT, 0.5, 0, 0, FOOT / 2), { depth: T, bevelEnabled: false, curveSegments: 12 });
    foot.translate(0, 0, -T / 2);
    const artGeo = shapeGeo(roundedRect(W, faceH, CORNER, 0, 0, faceH / 2), 16);
    return { bend, face, foot, artGeo, faceH };
  }, []);
  const black = finish === 'black';
  const mats = useMemo(() => {
    const body = new THREE.MeshPhysicalMaterial(black
      ? { color: '#030304', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 0.6 }
      : { color: '#e9e8e2', roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.2 });
    const edge = new THREE.MeshPhysicalMaterial(black
      ? { color: '#4a6414', emissive: LIME, emissiveIntensity: 0.05, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.4 }
      : { color: '#dcdbd4', roughness: 0.3, clearcoat: 0.5 });
    const artM = new THREE.MeshPhysicalMaterial(black
      ? { map: art, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.015, polygonOffset: true, polygonOffsetFactor: -2 }
      : { map: art, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.28, polygonOffset: true, polygonOffsetFactor: -2 });
    return { body, edge, artM, arr: [body, edge] };
  }, [finish, art]);
  const e = parts.bend.endPoint;
  return (
    <group {...props}>
      {/* foot and face tuck 0.5 mm into the bend so their end walls never show as a seam */}
      <mesh geometry={parts.foot} material={mats.arr} rotation={[Math.PI / 2, 0, 0]} position={[0, T / 2, -0.05]} castShadow={shadow} receiveShadow />
      <mesh geometry={parts.bend.g} material={mats.arr} castShadow={shadow} receiveShadow />
      <group position={[0, e.y, e.z]} rotation={[-TILT, 0, 0]}>
        <mesh geometry={parts.face} material={mats.arr} position={[0, -0.05, 0]} castShadow={shadow} receiveShadow />
        <mesh geometry={parts.artGeo} material={mats.artM} position={[0, 0, T / 2 + 0.004]} receiveShadow />
      </group>
    </group>
  );
};
// Where points on the artwork (u,v in 0..1, v from the top) sit in stand-local space, e.g. the NFC glyph or the QR.
export function standPoint(u: number, v: number, out = 0) {
  const { W, H, T, R, TILT } = STAND, faceH = H - 0.4, Rc = R + T / 2, end = Math.PI / 2 - TILT;
  const e = new THREE.Vector3(0, T / 2 + Rc - Rc * Math.cos(end), -Rc * Math.sin(end));
  const local = new THREE.Vector3((u - 0.5) * W, (1 - v) * faceH, T / 2 + out);
  return local.applyAxisAngle(new THREE.Vector3(1, 0, 0), -TILT).add(e);
}
export const ART = { nfc: [0.5, 0.64], qr: [0.7575, 0.4825], g: [0.5, 0.46], gMenu: [0.25, 0.49] } as const;

/* ---------- devices: flagship proportions, thin bezels, no logos ---------- */
const deviceBody = (w: number, h: number, r: number, depth: number, bevel: number) => {
  const g = new THREE.ExtrudeGeometry(squircleRect(w - bevel * 2, h - bevel * 2, r - bevel), { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 8, curveSegments: 32 });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  return g;
};
const useDeviceMats = (frame = '#55565b') => useMemo(() => ({
  frame: new THREE.MeshPhysicalMaterial({ color: frame, metalness: 1, roughness: 0.28, clearcoat: 0.4 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#030304', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.01 }),
  back: new THREE.MeshPhysicalMaterial({ color: '#232428', roughness: 0.38, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.35 }),
  lens: new THREE.MeshPhysicalMaterial({ color: '#050507', roughness: 0.02, metalness: 0.2, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.8 }),
  ring: new THREE.MeshPhysicalMaterial({ color: '#8a8c90', metalness: 1, roughness: 0.2 })
}), [frame]);
const screenMat = (tex: THREE.Texture, glow = 1) => new THREE.MeshPhysicalMaterial({
  color: '#000000', emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: glow, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.01, toneMapped: false
});

export const PHONE = { W: 7.2, H: 15.2, D: 0.82, R: 1.05, SW: 6.84, SH: 14.83 }; // screen 393×852 css
export const Phone: React.FC<JSX.IntrinsicElements['group'] & { tex?: THREE.Texture | null; glow?: number }> = ({ tex, glow = 0.95, ...props }) => {
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
export const Tablet: React.FC<JSX.IntrinsicElements['group'] & { tex?: THREE.Texture | null; glow?: number }> = ({ tex, glow = 1.12, ...props }) => {
  const m = useDeviceMats('#6d6f73');
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

// A minimal counter stand for the tablet (brushed aluminium), holds it at ~68°.
export const TabletStand: React.FC<JSX.IntrinsicElements['group']> = props => {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#b9bbbe', metalness: 1, roughness: 0.32 }), []);
  return (
    <group {...props}>
      <mesh material={mat} position={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[12, 0.6, 9]} /></mesh>
      <mesh material={mat} position={[0, 5.2, -1.6]} rotation={[-0.38, 0, 0]} castShadow><boxGeometry args={[3.2, 10, 0.6]} /></mesh>
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
