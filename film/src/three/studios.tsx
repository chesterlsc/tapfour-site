// The one set of the film: the product renders' dark studio (black gloss floor, soft key, lime kicker), matched to
// the supplied renders through the renders' own camera (see shots/LookDev.tsx). All procedural and offline.
import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette, Noise, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import { Q } from './quality';

/* ---------- canvas textures ---------- */
const texCache = new Map<string, THREE.Texture>();
export function canvasTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  if (texCache.has(key)) return texCache.get(key)!;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  texCache.set(key, t);
  return t;
}
// Deterministic noise
const rng = (s: number) => () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), (s >>>= 0) / 4294967296));

// Soft falloff for Lightformers so gloss reflections read as softboxes, not hard rectangles.
export const softbox = () => canvasTex('softbox', 256, 256, (c, w, h) => {
  const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, '#fff'); g.addColorStop(0.55, '#e8e8e8'); g.addColorStop(1, '#000');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
});
export const stripbox = () => canvasTex('stripbox', 256, 256, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#000'); g.addColorStop(0.3, '#fff'); g.addColorStop(0.7, '#fff'); g.addColorStop(1, '#000');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.15, 'rgba(0,0,0,0)'); v.addColorStop(0.85, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
  c.fillStyle = v; c.fillRect(0, 0, w, h);
});
export const radialBg = (key: string, inner: string, outer: string, cx = 0.5, cy = 0.42, r = 0.75) => canvasTex(key, 1024, 1024, (c, w, h) => {
  const g = c.createRadialGradient(w * cx, h * cy, 0, w * cx, h * cy, w * r);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const r2 = rng(7); const img = c.getImageData(0, 0, w, h); // dither against banding
  for (let i = 0; i < img.data.length; i += 4) { const n = (r2() - 0.5) * 3; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  c.putImageData(img, 0, 0);
});

/* ---------- post: bloom, depth of field, grain, vignette ---------- */
export const Post: React.FC<{ focus?: THREE.Vector3 | [number, number, number]; range?: number; bokeh?: number; bloom?: number; vignette?: number; dof?: boolean }> = ({ focus, range = 12, bokeh = 3, bloom = 0.28, vignette = 0.5, dof = true }) => {
  // A new vector every frame: R3F copies a primitive's prop into effect.target only when the reference changes.
  const target = focus ? (Array.isArray(focus) ? new THREE.Vector3(...focus) : focus.clone()) : undefined;
  return (
    <EffectComposer multisampling={Q.msaa} enableNormalPass={false}>
      {dof && Q.dof && focus ? <DepthOfField target={target} worldFocusRange={range} bokehScale={bokeh} /> : <></>}
      <Bloom intensity={bloom} luminanceThreshold={0.97} luminanceSmoothing={0.15} mipmapBlur />
      {/* Khronos PBR Neutral: keeps UI and brand colours true below the highlight shoulder */}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.28} darkness={vignette} />
      <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} premultiply />
    </EffectComposer>
  );
};

/* ---------- 1 · dark studio with floor reflection (renders: black stand, dark studio) ---------- */
// The renders' floor: black gloss. A true mirror (rendered from the reflected camera each frame) under a thin,
// tinted, satin top layer that darkens it to the renders' ~40 % reflection and takes the contact shadows.
const GlossFloor: React.FC = () => {
  const { size } = useThree();
  const mirror = useMemo(() => {
    const r = new Reflector(new THREE.PlaneGeometry(800, 800), { textureWidth: size.width, textureHeight: size.height, color: 0x8e8e8e, clipBias: 0.002 });
    r.rotation.x = -Math.PI / 2;
    return r;
  }, [size.width, size.height]);
  return (
    <>
      <primitive object={mirror} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.012} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshPhysicalMaterial color="#070806" transparent opacity={0.64} roughness={0.55} clearcoat={0.4} clearcoatRoughness={0.3} depthWrite={false} />
      </mesh>
    </>
  );
};

export const DarkStudio: React.FC<{ children: React.ReactNode; glow?: number }> = ({ children, glow = 1 }) => {
  const bg = radialBg('dark-bg', '#161b10', '#050605', 0.5, 0.45, 0.75);
  const sb = softbox(), st = stripbox();
  const { scene } = useThree();
  useLayoutEffect(() => { scene.background = bg; scene.fog = new THREE.Fog('#090b07', 90, 260); }, []);
  // Matched to the renders: a big soft key high on the right (the gloss streak down the black face's right edge),
  // a narrow strip on the left, a faint lime ring behind (the thin lime line on the black sheet's edge),
  // and a mirror-like dark floor with a softened reflection.
  return (
    <>
      <Environment resolution={512} frames={1}>
        <Lightformer form="rect" map={sb} intensity={7 * glow} color="#ffffff" position={[60, 55, 10]} scale={[45, 90, 1]} target={[0, 10, 0]} />
        <Lightformer form="rect" map={st} intensity={2.2 * glow} color="#ffffff" position={[-55, 30, 25]} scale={[18, 70, 1]} target={[0, 10, 0]} />
        <Lightformer form="rect" map={sb} intensity={1.5 * glow} color="#ffffff" position={[-10, 30, 70]} scale={[60, 50, 1]} target={[0, 8, 0]} />
        <Lightformer form="rect" map={st} intensity={9 * glow} color="#ffffff" position={[55, 35, 45]} scale={[16, 60, 1]} target={[0, 10, 0]} />
        <Lightformer form="ring" intensity={0.25} color="#c8f23c" position={[-20, 40, -70]} scale={30} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.3} color="#ffffff" position={[0, 90, 0]} rotation-x={Math.PI / 2} scale={[80, 80, 1]} />
      </Environment>
      <ambientLight intensity={0.06} />
      <spotLight position={[35, 75, 55]} angle={0.42} penumbra={0.9} intensity={26000} decay={2} castShadow shadow-mapSize={[Q.shadow, Q.shadow]} shadow-bias={-0.0004} color="#fffdf7" />
      <GlossFloor />
      {children}
    </>
  );
};
