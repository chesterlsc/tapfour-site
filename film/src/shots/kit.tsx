// The 2D kit every shot is built from. No generated 3D: the stands are the supplied product renders (public/art/r-*.jpg,
// one camera, one dark studio), cut out with a soft mask and set on the empty studio plate; the phone and tablet are
// layered CSS bodies (titanium rim with real thickness, black glass, camera island) showing the rendered screens.
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { DESIGN } from '../timeline';
import { C, clamp, easeIO, ease } from '../brand';

export const useT = () => { const f = useCurrentFrame(), { fps } = useVideoConfig(); return f / fps; };
export const useF = () => useCurrentFrame();
export const tween = (t: number, a: number, b: number, from = 0, to = 1, e = easeIO) => interpolate(t, [a, b], [from, to], { ...clamp, easing: e });
// Keyframed value: [[t, v], …] eased between neighbours.
export const keys = (t: number, k: [number, number][], e = easeIO) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return tween(t, k[i][0], k[i + 1][0], k[i][1], k[i + 1][1], e);
  return k[k.length - 1][1];
};
// Slow, organic handheld/camera drift (two incommensurate sines).
export const drift = (t: number, amp: number, seed = 0) => amp * (Math.sin(t * 0.61 + seed * 1.7) * 0.6 + Math.sin(t * 1.37 + seed * 3.1) * 0.4);

// All layout is in 1920×1080 design px, scaled to the output size here.
export const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useVideoConfig();
  const s = width / DESIGN.width;
  return <div style={{ position: 'absolute', left: 0, top: 0, width: DESIGN.width, height: DESIGN.height, transform: `scale(${s})`, transformOrigin: '0 0', overflow: 'hidden' }}>{children}</div>;
};

// A camera move on a 2D layer: scale about a point, then pan. `blur` is depth of field.
export const Layer: React.FC<{ s?: number; ox?: number; oy?: number; x?: number; y?: number; blur?: number; dim?: number; children: React.ReactNode }> = ({ s = 1, ox = 960, oy = 540, x = 0, y = 0, blur = 0, dim = 0, children }) => (
  <div style={{ position: 'absolute', inset: 0, transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: `${ox}px ${oy}px`, filter: [blur > 0.05 ? `blur(${blur}px)` : '', dim > 0 ? `brightness(${1 - dim})` : ''].join(' ') || undefined }}>{children}</div>
);

// The empty dark studio (built from the renders' own background by capture/plates.py).
export const Studio: React.FC<{ s?: number; x?: number; y?: number }> = ({ s = 1, x = 0, y = 0 }) => (
  <Img src={staticFile('art/plate-empty.jpg')} style={{ position: 'absolute', left: -960 * (s - 1) + x, top: -540 * (s - 1) + y, width: 1920 * s, height: 1080 * s }} />
);

/* ---------------- Stands: the supplied renders ---------------- */
export type StandName = 'black-review' | 'black-menu' | 'white-review' | 'white-menu';
// Render geometry (2160×3840 px): the stand meets the floor at y 2640 under x 1200; its front face corners, and the
// artwork's key points in face units (the face is 1000 × 1500 units, 10 × 15 cm).
export const R = { w: 2160, h: 3840, footX: 1200, floor: 2640, face: [[740, 800], [1640, 760], [1696, 2410], [830, 2600]] as [number, number][] };
export const FACE = { w: 1000, h: 1500, nfc: [501, 967], qr: [723, 763], gMenu: [292, 784] } as const;

// CSS matrix3d mapping the rectangle (0,0)–(W,H) onto a quad (TL, TR, BR, BL).
export function quadMatrix(W: number, H: number, q: [number, number][]) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return `matrix3d(${[a / W, d / W, 0, g / W, b / H, e / H, 0, h / H, 0, 0, 1, 0, x0, y0, 0, 1].join(',')})`;
}
export const faceToRender = (u: number, v: number): [number, number] => {
  // same homography, evaluated (for placing things in design px)
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = R.face;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  const U = u / FACE.w, V = v / FACE.h, w = g * U + h * V + 1;
  return [((x1 - x0 + g * x1) * U + (x3 - x0 + h * x3) * V + x0) / w, ((y1 - y0 + g * y1) * U + (y3 - y0 + h * y3) * V + y0) / w];
};
// Where a face point lands in design px for a stand placed at (x, floor) with scale s.
export const standPt = (x: number, floor: number, s: number, p: readonly [number, number] | readonly number[]) => {
  const [rx, ry] = faceToRender(p[0], p[1]);
  return [x + (rx - R.footX) * s, floor + (ry - R.floor) * s] as [number, number];
};

// A stand render placed with its foot at (x, floor) and `s` design px per render px (0.32 ≈ the plates' scale).
// `lift` raises the stand off the floor while its reflection drops by the same amount (for landings).
// Children are drawn on the stand's face in face units (0..1000 × 0..1500).
export const Stand: React.FC<{ name: StandName; x: number; floor: number; s: number; lift?: number; opacity?: number; reflection?: number; sweep?: number; children?: React.ReactNode }> = ({ name, x, floor, s, lift = 0, opacity = 1, reflection = 1, sweep, children }) => {
  const src = staticFile(`art/r-${name}.jpg`);
  const mask = 'radial-gradient(ellipse 760px 1560px at 1215px 1980px, #000 62%, transparent 100%)';
  const cut = (above: boolean, dy: number, op: number) => (
    <div style={{ position: 'absolute', left: 0, top: 0, width: R.w, height: R.h, transform: `translateY(${dy}px)`, opacity: op, clipPath: above ? `inset(0 0 ${R.h - R.floor - 4}px 0)` : `inset(${R.floor - 4}px 0 0 0)`, WebkitMaskImage: mask, maskImage: mask }}>
      <Img src={src} style={{ width: R.w, height: R.h, display: 'block' }} />
    </div>
  );
  const L = lift / s;
  const poly = R.face.map(([px, py]) => `${px}px ${py - L}px`).join(',');
  return (
    <div style={{ position: 'absolute', left: x - R.footX * s, top: floor - R.floor * s, width: R.w, height: R.h, transform: `scale(${s})`, transformOrigin: '0 0', opacity }}>
      {cut(false, L, reflection * (L > 0 ? Math.max(0, 1 - L / 900) : 1))}
      {cut(true, -L, 1)}
      {sweep !== undefined && (
        <div style={{ position: 'absolute', inset: 0, clipPath: `polygon(${poly})`, mixBlendMode: 'screen' }}>
          <div style={{ position: 'absolute', top: 0, height: R.h, width: 380, left: 600 + sweep * 1300, transform: 'skewX(-16deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.09) 40%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.09) 60%, transparent)', filter: 'blur(20px)' }} />
        </div>
      )}
      {children && (
        <div style={{ position: 'absolute', left: 0, top: -L, width: FACE.w, height: FACE.h, transform: quadMatrix(FACE.w, FACE.h, R.face), transformOrigin: '0 0' }}>{children}</div>
      )}
    </div>
  );
};

// NFC contact on the face: a lime pulse at the contactless mark and rings spreading across the acrylic.
export const Ripple: React.FC<{ t: number; at: number; x?: number; y?: number }> = ({ t, at, x = FACE.nfc[0], y = FACE.nfc[1] }) => {
  if (t < at || t > at + 2) return null;
  const glow = tween(t, at, at + 0.08, 0, 1) * tween(t, at + 0.2, at + 1.1, 1, 0);
  return (
    <div style={{ position: 'absolute', left: x, top: y, mixBlendMode: 'screen' }}>
      <div style={{ position: 'absolute', left: -170, top: -170, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,242,60,.55), rgba(200,242,60,.12) 45%, transparent 70%)', opacity: glow }} />
      {[0, 1, 2].map(i => {
        const u = (t - at - i * 0.17) / 1.25;
        if (u < 0 || u > 1) return null;
        const r = 50 + ease(u) * 520, w = 5 + 12 * (1 - u);
        return <div key={i} style={{ position: 'absolute', left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: '50%', border: `${w}px solid ${C.lime}`, opacity: Math.pow(1 - u, 1.6) * 0.9, boxShadow: `0 0 ${24 * (1 - u)}px rgba(200,242,60,.6)` }} />;
      })}
    </div>
  );
};

/* ---------------- Devices ---------------- */
// Screen frames rendered from the screen compositions (render.mjs step 1).
export const Screen: React.FC<{ dir: string; frame: number; count: number; w: number; h: number }> = ({ dir, frame, count, w, h }) => (
  <Img src={staticFile(`screens/${dir}/${String(Math.max(0, Math.min(count - 1, frame))).padStart(4, '0')}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, display: 'block' }} />
);

type Body = { W: number; H: number; sw: number; sh: number; bezel: number; rim: number; r: number; depth: number };
// Flagship proportions, in the screen's CSS px: phone 393×852 (≈ 6.1″, 8 mm), tablet 1180×820 (≈ 11″, 6 mm).
export const PHONE: Body = { W: 413, H: 872, sw: 393, sh: 852, bezel: 6, rim: 4, r: 64, depth: 44 };
export const TABLET: Body = { W: 1236, H: 876, sw: 1180, sh: 820, bezel: 24, rim: 4, r: 44, depth: 30 };

export type Pose = { x: number; y: number; h: number; rx?: number; ry?: number; rz?: number };
const Ti = 'linear-gradient(135deg, #a4a3a0 0%, #4a4a4c 18%, #7d7c79 38%, #2e2e30 56%, #6d6c69 76%, #3a3a3c 90%, #9a9996 100%)';

const DeviceBody: React.FC<{ b: Body; kind: 'phone' | 'tablet'; ry: number; children: React.ReactNode }> = ({ b, kind, ry, children }) => {
  const N = 11;
  const inner = b.rim, scr = b.rim + b.bezel;
  // the rim's side wall: stacked outlines behind the front face give the body its real thickness
  const layers = Array.from({ length: N }, (_, i) => {
    const z = -b.depth * (i + 1) / N;
    const shade = 0.55 + 0.35 * Math.sin(Math.PI * (i + 1) / (N + 1));
    return <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: b.r, transform: `translateZ(${z}px)`, background: `linear-gradient(90deg, rgba(40,40,42,1), rgba(${Math.round(120 * shade)},${Math.round(119 * shade)},${Math.round(116 * shade)},1) 6%, #2b2b2d 50%, rgba(${Math.round(120 * shade)},${Math.round(119 * shade)},${Math.round(116 * shade)},1) 94%, rgba(40,40,42,1))` }} />;
  });
  const btn = (side: 'l' | 'r', top: number, h: number) => (
    <div style={{ position: 'absolute', [side === 'l' ? 'left' : 'right']: -2.6, top, width: 5, height: h, borderRadius: 2.5, background: 'linear-gradient(90deg, #5a5a5c, #b3b2af 50%, #4a4a4c)', transform: `translateZ(${-b.depth / 2}px)` }} />
  );
  const glare = 0.5 + ry / 60;
  return (
    <>
      {layers.reverse()}
      {kind === 'phone' ? <>{btn('l', 150, 34)}{btn('l', 214, 66)}{btn('l', 294, 66)}{btn('r', 244, 104)}</> : <>{btn('r', 110, 56)}{btn('r', 176, 56)}</>}
      {/* front: polished rim → black glass → display */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: b.r, background: Ti, boxShadow: 'inset 0 0 0 0.8px rgba(255,255,255,.35)' }} />
      <div style={{ position: 'absolute', inset: inner, borderRadius: b.r - inner, background: '#030303', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }} />
      <div style={{ position: 'absolute', left: scr, top: scr, width: b.sw, height: b.sh, borderRadius: kind === 'phone' ? b.r - scr : 20, overflow: 'hidden', background: '#000', transform: 'translateZ(0.5px)' }}>
        {children}
        {kind === 'phone' && (
          <div style={{ position: 'absolute', left: '50%', top: 11, width: 124, height: 36, marginLeft: -62, borderRadius: 18, background: '#000', zIndex: 100 }}>
            <div style={{ position: 'absolute', right: 12, top: 11, width: 14, height: 14, borderRadius: 7, background: 'radial-gradient(circle at 40% 40%, #1d2a44, #07090d 60%)' }} />
          </div>
        )}
        {/* cover-glass reflection, sliding with the body's rotation */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(118deg, rgba(255,255,255,0) ${glare * 100 - 30}%, rgba(255,255,255,.07) ${glare * 100 - 8}%, rgba(255,255,255,.015) ${glare * 100 + 8}%, rgba(255,255,255,0) ${glare * 100 + 30}%)`, zIndex: 101 }} />
      </div>
      {kind === 'tablet' && <div style={{ position: 'absolute', left: '50%', top: inner + b.bezel / 2 - 4, width: 8, height: 8, marginLeft: -4, borderRadius: 4, background: 'radial-gradient(circle at 40% 40%, #1d2a44, #050608 65%)', transform: 'translateZ(0.5px)' }} />}
    </>
  );
};

// A device posed in the scene: centre (x, y) and on-screen height h in design px, rotations in degrees.
// `floor` (design y) adds a mirrored reflection on the studio's glossy floor, like the stand renders have.
export const Device: React.FC<Pose & { kind: 'phone' | 'tablet'; floor?: number; reflect?: number; shadow?: number; children: React.ReactNode }> = ({ kind, x, y, h, rx = 0, ry = 0, rz = 0, floor, reflect = 0.2, shadow = 0.5, children }) => {
  const b = kind === 'phone' ? PHONE : TABLET;
  const k = h / b.H;
  const body = (
    <div style={{ position: 'absolute', left: x, top: y, perspective: 3200 / k, width: 0, height: 0 }}>
      <div style={{ position: 'absolute', left: -b.W / 2, top: -b.H / 2, width: b.W, height: b.H, transformStyle: 'preserve-3d', transform: `scale(${k}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
        <DeviceBody b={b} kind={kind} ry={ry}>{children}</DeviceBody>
      </div>
    </div>
  );
  return (
    <>
      {floor !== undefined && (
        <>
          <div style={{ position: 'absolute', left: x - b.W * k * 0.62, top: floor - 26, width: b.W * k * 1.24, height: 52, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,.85), transparent 70%)', opacity: shadow }} />
          <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `linear-gradient(to bottom, transparent ${floor}px, #000 ${floor + 1}px, transparent ${floor + h * 0.55}px)`, opacity: reflect, filter: 'blur(1.5px)' }}>
            <div style={{ position: 'absolute', inset: 0, transform: `matrix(1,0,0,-1,0,${2 * floor})`, transformOrigin: '0 0' }}>{body}</div>
          </div>
        </>
      )}
      {floor === undefined && shadow > 0 && (
        <div style={{ position: 'absolute', left: x - b.W * k * 0.5, top: y - b.H * k * 0.42, width: b.W * k, height: b.H * k * 0.95, borderRadius: b.r * k, boxShadow: `0 ${40 * k}px ${120 * k}px rgba(0,0,0,${0.7 * shadow})`, transform: `rotate(${rz}deg)` }} />
      )}
      {body}
    </>
  );
};
export const Phone: React.FC<Pose & { floor?: number; shadow?: number; children: React.ReactNode }> = p => <Device kind="phone" {...p} />;
export const Tablet: React.FC<Pose & { floor?: number; shadow?: number; children: React.ReactNode }> = p => <Device kind="tablet" {...p} />;

export const Frame: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = '#0b0c0a' }) => (
  <AbsoluteFill style={{ background: bg }}><Overlay>{children}</Overlay></AbsoluteFill>
);
