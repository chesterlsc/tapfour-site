// Lighting setups matching the product renders: dark studio with floor reflection, lime studio, warm neutral
// with leaf shadows, plus the café used for the ordering / owner / Solo shots. All procedural and offline.
import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial, ContactShadows } from '@react-three/drei';
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

// Leaf silhouettes for the gobo: white = light, dark = leaf shadow (a ficus / olive branch).
export const leafGobo = () => canvasTex('leaf-gobo', 1024, 1024, (c, w, h) => {
  c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
  const r = rng(42);
  c.filter = 'blur(5px)';
  const leaf = (x: number, y: number, len: number, ang: number) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.26, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.26, 0, 0);
    c.fillStyle = 'rgba(12,12,10,0.92)'; c.fill(); c.restore();
  };
  for (let b = 0; b < 5; b++) {
    let x = w * (0.1 + r() * 0.8), y = -40, ang = Math.PI / 2 + (r() - 0.5) * 0.9;
    c.lineWidth = 7; c.strokeStyle = 'rgba(12,12,10,0.9)';
    for (let s = 0; s < 26; s++) {
      const nx = x + Math.cos(ang) * 42, ny = y + Math.sin(ang) * 42;
      c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke();
      const side = s % 2 ? 1 : -1;
      leaf(nx, ny, 70 + r() * 55, ang + side * (0.7 + r() * 0.5));
      x = nx; y = ny; ang += (r() - 0.5) * 0.35;
    }
  }
}, false);

export const woodTex = (key: string, base = '#9a6b43', w = 1024, h = 1024, planks = 0) => canvasTex(key, w, h, (c) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  const r = rng(key.length * 31 + 7);
  for (let i = 0; i < 520; i++) {
    const y = r() * h, a = 0.03 + r() * 0.08, lw = 0.6 + r() * 2.4;
    c.strokeStyle = r() > 0.5 ? `rgba(60,34,16,${a})` : `rgba(255,220,170,${a * 0.6})`; c.lineWidth = lw;
    c.beginPath(); c.moveTo(0, y);
    for (let x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x * 0.004 + i) * 6 + Math.sin(x * 0.019 + i * 3) * 1.5);
    c.stroke();
  }
  if (planks) for (let p = 1; p < planks; p++) { c.fillStyle = 'rgba(40,24,12,.35)'; c.fillRect(0, (h / planks) * p - 1, w, 2); }
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
export const DarkStudio: React.FC<{ children: React.ReactNode; glow?: number }> = ({ children, glow = 1 }) => {
  const bg = radialBg('dark-bg', '#141a0e', '#030403', 0.5, 0.4, 0.7);
  const sb = softbox(), st = stripbox();
  const { scene } = useThree();
  useLayoutEffect(() => { scene.background = bg; scene.fog = new THREE.Fog('#0b0f08', 55, 150); }, []);
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" map={sb} intensity={5 * glow} color="#ffffff" position={[35, 40, 30]} scale={[60, 90, 1]} target={[0, 10, 0]} />
        <Lightformer form="rect" map={st} intensity={2 * glow} color="#e8ffd0" position={[-50, 25, 10]} scale={[20, 70, 1]} target={[0, 10, 0]} />
        <Lightformer form="ring" intensity={0.6} color="#c8f23c" position={[0, 60, -60]} scale={40} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.4} color="#ffffff" position={[0, 90, 0]} rotation-x={Math.PI / 2} scale={[80, 80, 1]} />
      </Environment>
      <ambientLight intensity={0.05} />
      <spotLight position={[40, 70, 50]} angle={0.45} penumbra={0.9} intensity={9000} decay={2} castShadow shadow-mapSize={[Q.shadow, Q.shadow]} shadow-bias={-0.0004} color="#fffdf5" />
      <pointLight position={[-30, 25, -40]} intensity={900} color="#c8f23c" decay={2} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <MeshReflectorMaterial resolution={Q.refl} blur={[120, 40]} mixBlur={0.6} mixStrength={4} mixContrast={1.2} depthScale={0} mirror={1} roughness={1} metalness={0} color="#070807" />
      </mesh>
      {children}
    </>
  );
};

/* ---------- 2 · lime studio: brand-lime cyclorama, soft top light ---------- */
function cyclorama(width: number, floor: number, radius: number, wall: number) {
  const segX = 2, prof: [number, number][] = [];
  prof.push([0, floor]);
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI / 2; prof.push([radius - Math.cos(a) * radius, -Math.sin(a) * radius]); }
  prof.push([wall, -radius]);
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  prof.forEach(([y, z], j) => { for (let i = 0; i < segX; i++) { const x = -width / 2 + (width * i) / (segX - 1); pos.push(x, y, z); uv.push(i / (segX - 1), j / (prof.length - 1)); } });
  for (let j = 0; j < prof.length - 1; j++) { const a = j * segX, b = (j + 1) * segX; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
export const LimeStudio: React.FC<{ children: React.ReactNode; back?: number }> = ({ children, back = -30 }) => {
  const geo = useMemo(() => cyclorama(1200, 400, 70, 500), []);
  const { scene } = useThree();
  useLayoutEffect(() => { scene.background = new THREE.Color('#b8e032'); scene.fog = null; }, []);
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 60, 30]} rotation-x={Math.PI / 2} scale={[80, 50, 1]} />
        <Lightformer form="rect" intensity={2} position={[50, 20, 30]} scale={[30, 50, 1]} target={[0, 8, 0]} />
        <Lightformer form="rect" intensity={1.4} color="#d4ff5a" position={[-60, 20, 0]} scale={[40, 60, 1]} target={[0, 8, 0]} />
        <mesh position={[0, 0, -80]}><planeGeometry args={[400, 400]} /><meshBasicMaterial color="#4a6310" /></mesh>
      </Environment>
      <hemisphereLight args={['#f4ffd8', '#8fb81a', 1.1]} />
      <directionalLight position={[20, 60, 35]} intensity={2.6} castShadow shadow-mapSize={[Q.shadow, Q.shadow]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-radius={14} shadow-bias={-0.0004} color="#fffbef" />
      <mesh geometry={geo} position={[0, 0, back]} rotation={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#c8f23c" roughness={0.95} />
      </mesh>
      <ContactShadows position={[0, 0.02, 0]} scale={80} blur={2.2} far={12} opacity={0.55} resolution={1024} color="#3d5200" frames={1} />
      {children}
    </>
  );
};

/* ---------- 3 · warm neutral with leaf shadows ---------- */
export const WarmStudio: React.FC<{ children: React.ReactNode; wallZ?: number; table?: boolean }> = ({ children, wallZ = -26, table = true }) => {
  const gobo = leafGobo();
  const spot = useRef<THREE.SpotLight>(null);
  const tgt = useMemo(() => { const o = new THREE.Object3D(); o.position.set(-6, 10, wallZ); return o; }, [wallZ]);
  const wood = woodTex('oak-table', '#b88a5e');
  const { scene } = useThree();
  useLayoutEffect(() => { scene.background = new THREE.Color('#d8cbb8'); scene.fog = null; spot.current!.target = tgt; spot.current!.map = gobo; }, []);
  return (
    <>
      <primitive object={tgt} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" map={softbox()} intensity={2.6} color="#fff1dc" position={[40, 50, 40]} scale={[60, 70, 1]} target={[0, 8, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#ffe8cc" position={[-50, 25, 20]} scale={[30, 60, 1]} target={[0, 8, 0]} />
        <mesh position={[0, 20, -60]}><planeGeometry args={[300, 200]} /><meshBasicMaterial color="#a8987f" /></mesh>
      </Environment>
      <hemisphereLight args={['#fff4e2', '#7a6552', 0.85]} />
      <spotLight ref={spot} position={[70, 90, 80]} angle={0.32} penumbra={0.35} intensity={42000} decay={2} color="#ffe2b8" castShadow shadow-mapSize={[Q.shadow, Q.shadow]} shadow-bias={-0.0005} />
      <mesh position={[0, 60, wallZ]} receiveShadow><planeGeometry args={[600, 300]} /><meshStandardMaterial color="#e2d6c4" roughness={0.95} /></mesh>
      {table ? (
        <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[400, 200]} /><meshPhysicalMaterial map={wood} roughness={0.55} clearcoat={0.3} clearcoatRoughness={0.4} /></mesh>
      ) : (
        <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[600, 300]} /><meshStandardMaterial color="#d9ccb9" roughness={0.9} /></mesh>
      )}
      <ContactShadows position={[0, 0.03, 0]} scale={60} blur={1.6} far={8} opacity={0.5} resolution={1024} color="#2a1a0c" frames={1} />
      {children}
    </>
  );
};

/* ---------- café interior: warm, pendant lights, plants — for ordering, owner app and Solo ---------- */
export const Pendant: React.FC<JSX.IntrinsicElements['group']> = props => (
  <group {...props}>
    <mesh position={[0, 40, 0]}><cylinderGeometry args={[0.15, 0.15, 80, 6]} /><meshStandardMaterial color="#111" /></mesh>
    <mesh><sphereGeometry args={[5, 24, 16]} /><meshStandardMaterial color="#fff2d6" emissive="#ffb866" emissiveIntensity={6} toneMapped={false} /></mesh>
    <pointLight intensity={2600} distance={260} decay={2} color="#ffc88a" />
  </group>
);
// A ceramic latte cup on a saucer (lathe profile), with crema and a latte-art heart.
export const Cup: React.FC<JSX.IntrinsicElements['group'] & { color?: string }> = ({ color = '#f3efe8', ...props }) => {
  const g = useMemo(() => {
    const outer = [[0, 0.6], [2.4, 0.6], [2.7, 0.8], [3.6, 2.2], [4.3, 4.4], [4.55, 5.9], [4.6, 6.2], [4.35, 6.2], [4.1, 4.6], [3.4, 2.5], [2.5, 1.3], [0, 1.2]];
    return new THREE.LatheGeometry(outer.map(([x, y]) => new THREE.Vector2(x, y)), 72);
  }, []);
  const saucer = useMemo(() => new THREE.LatheGeometry([[0, 0], [3.2, 0], [3.6, 0.25], [6.8, 0.55], [7.2, 0.9], [6.9, 0.95], [3.4, 0.6], [0, 0.55]].map(([x, y]) => new THREE.Vector2(x, y)), 72), []);
  const art = useMemo(() => canvasTex('latte-art', 256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#caa27a'); g.addColorStop(0.75, '#9c6a40'); g.addColorStop(1, '#6e4424');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f1e4cf'; c.beginPath(); c.moveTo(128, 180);
    c.bezierCurveTo(40, 120, 70, 60, 128, 98); c.bezierCurveTo(186, 60, 216, 120, 128, 180); c.fill();
  }), []);
  const ceramic = <meshPhysicalMaterial color={color} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
  return (
    <group {...props}>
      <mesh geometry={saucer} castShadow receiveShadow>{ceramic}</mesh>
      <mesh geometry={g} position={[0, 0.3, 0]} castShadow receiveShadow>{ceramic}</mesh>
      <mesh position={[0, 5.75, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[4.25, 64]} /><meshPhysicalMaterial map={art} roughness={0.35} clearcoat={0.5} /></mesh>
      <mesh position={[4.35, 3.9, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow><torusGeometry args={[1.25, 0.33, 14, 28, Math.PI]} />{ceramic}</mesh>
    </group>
  );
};
// A leafy pot plant: thin elongated leaves on arching stems (kept soft by depth of field).
export const Plant: React.FC<JSX.IntrinsicElements['group']> = props => {
  const leaves = useMemo(() => { const r = rng(9); return Array.from({ length: 70 }, () => ({ a: r() * Math.PI * 2, h: 16 + r() * 34, out: 3 + r() * 11, tilt: 0.3 + r() * 0.9, s: 3.5 + r() * 3, roll: (r() - 0.5) * 0.8, c: r() })); }, []);
  return (
    <group {...props}>
      <mesh position={[0, 8, 0]} castShadow receiveShadow><cylinderGeometry args={[9, 7, 16, 40]} /><meshStandardMaterial color="#cbbba6" roughness={0.75} /></mesh>
      <mesh position={[0, 15.8, 0]}><cylinderGeometry args={[8.6, 8.6, 0.4, 40]} /><meshStandardMaterial color="#3b2a1c" roughness={1} /></mesh>
      {leaves.map((l, i) => (
        <group key={i} rotation={[0, l.a, 0]}>
          <mesh position={[0, l.h, l.out]} rotation={[l.tilt, 0, l.roll]} scale={[l.s * 0.38, 0.08, l.s]} castShadow>
            <sphereGeometry args={[1, 14, 8]} />
            <meshStandardMaterial color={l.c > 0.6 ? '#4f7a2e' : l.c > 0.3 ? '#3e6526' : '#5c8a36'} roughness={0.55} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
export const Cafe: React.FC<{ children: React.ReactNode; wall?: boolean; fog?: boolean }> = ({ children, wall = true, fog = true }) => {
  const wood = woodTex('walnut-table', '#8a5f3c');
  const { scene } = useThree();
  useLayoutEffect(() => { scene.background = new THREE.Color('#1a130d'); scene.fog = fog ? new THREE.Fog('#1a130d', 180, 520) : null; }, []);
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" map={softbox()} intensity={2.4} color="#ffe2bd" position={[30, 60, 30]} scale={[70, 50, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={5} color="#ffb866" position={[-40, 50, -40]} scale={12} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={5} color="#ffb866" position={[50, 50, -60]} scale={12} target={[0, 0, 0]} />
        <Lightformer form="rect" map={stripbox()} intensity={0.9} color="#ffffff" position={[-60, 30, 40]} scale={[30, 40, 1]} target={[0, 0, 0]} />
      </Environment>
      <hemisphereLight args={['#ffe4c4', '#2b1a0f', 0.55]} />
      <directionalLight position={[30, 80, 40]} intensity={1.4} color="#fff0da" castShadow shadow-mapSize={[Q.shadow, Q.shadow]} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-radius={8} shadow-bias={-0.0004} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[240, 140]} /><meshPhysicalMaterial map={wood} roughness={0.5} clearcoat={0.4} clearcoatRoughness={0.35} /></mesh>
      {wall && <>
        <mesh position={[0, 80, -140]}><planeGeometry args={[900, 400]} /><meshStandardMaterial color="#3b2a1d" roughness={0.9} /></mesh>
        <Pendant position={[-70, 70, -90]} /><Pendant position={[60, 64, -120]} /><Pendant position={[150, 72, -60]} />
        <Plant position={[-120, -30, -80]} scale={1.4} />
      </>}
      <ContactShadows position={[0, 0.03, 0]} scale={60} blur={1.8} far={10} opacity={0.55} resolution={1024} color="#1a0f06" frames={1} />
      {children}
    </>
  );
};
