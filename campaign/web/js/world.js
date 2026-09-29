// Renderer, lighting environments and the glossy tabletop. Units: mm.
import * as THREE from 'three';

export function makeRenderer(canvas, w, h) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(w, h, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  return r;
}

// Softbox environments, baked to a PMREM for reflections + diffuse light.
// 'studio': cool grey studio like the product photos. 'warm': evening restaurant (amber practicals, soft key).
export function makeEnvironment(renderer, mood = 'studio') {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(5000, 48, 24), new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: mood === 'warm' ? 0x0b0806 : 0x08090a }));
  scene.add(room);
  const box = (w, h, color, k, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...(look || [0, 0, 0])); scene.add(m); return m;
  };
  const glow = (r, color, k, pos) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) })); m.position.set(...pos); scene.add(m); };
  if (mood === 'warm') {
    box(1800, 1100, 0xfff1dc, 2.2, [-900, 2400, 1400]);          // soft key, above-front-left
    box(2600, 1400, 0xffe2c0, 0.32, [700, 1300, 2600]);           // soft frontal sheen on the face
    box(260, 2600, 0xffd8a8, 2.6, [-2600, 600, -300]);            // tall window strip left
    box(260, 2200, 0xffc38a, 1.6, [2400, 500, -1800]);            // rim right-back
    for (const [x, y, z, k] of [[-1500, 150, -2600, 9], [300, 260, -3000, 7], [1700, 120, -2200, 10], [-600, 500, -3400, 6], [2400, 380, -2900, 7]]) glow(70, 0xffa84a, k, [x, y, z]);
    box(4000, 400, 0x3a2a1c, 0.6, [0, -600, 2600]);               // floor bounce
  } else {
    box(2000, 1200, 0xffffff, 2.4, [-1000, 2600, 1300]);          // big overhead key
    box(3000, 1600, 0xffffff, 0.45, [500, 1400, 2800]);           // frontal sheet: soft sheen down the face
    box(220, 3000, 0xffffff, 3.2, [-2600, 700, 200]);             // long strip left (edge highlight)
    box(220, 2600, 0xf4f7ff, 2.0, [2500, 800, -1500]);            // rim right
    box(3000, 900, 0xffffff, 0.35, [0, 800, -3200]);              // back wall fill
    box(4000, 300, 0x222326, 0.8, [0, -500, 2800]);               // floor bounce
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(scene, 0, 1, 10000).texture;
  pm.dispose();
  return env;
}

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Backdrop: a big curved sweep behind the table with a soft light pool, like the product photos.
export function makeBackdrop({ top = '#2b2c2f', mid = '#141416', bottom = '#060607', spot = [0.62, 0.28], spotColor = 'rgba(70,72,78,0.9)', warm = false } = {}) {
  const tex = canvasTex(1024, 1024, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bottom);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = x.createRadialGradient(w * spot[0], h * spot[1], 0, w * spot[0], h * spot[1], w * 0.6);
    r.addColorStop(0, spotColor); r.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h);
    if (warm) bokeh(x, w, h);
    dither(x, w, h);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, depthWrite: false }));
  m.position.set(0, 1200, -2600);
  return m;
}

// Seamless studio sweep: floor → curve → wall, so no horizon line shows at any camera angle.
// The floor matches the tabletop colour; the wall carries the soft light pool (and bokeh for 'warm').
export function makeCyc({ floor = [10, 10, 11], wall = '#26272a', glow = 'rgba(78,80,86,0.85)', spot = [0.62, 0.42], warm = false, floorZ = -700, radius = 1800, wallZ } = {}) {
  const prof = []; // (y, z, s)
  const zc = floorZ - radius;
  for (let z = 4000; z > floorZ; z -= 200) prof.push([0, z]);
  for (let i = 0; i <= 24; i++) { const a = Math.PI / 2 * i / 24; prof.push([radius - radius * Math.cos(a), floorZ - radius * Math.sin(a)]); }
  for (let y = radius + 300; y <= 6000; y += 300) prof.push([y, zc]);
  let s = 0; const S = prof.map((p, i) => (i ? (s += Math.hypot(p[0] - prof[i - 1][0], p[1] - prof[i - 1][1])) : 0));
  const total = s, sCurve = S[prof.findIndex(p => p[1] <= floorZ)];
  const X = 12000, NX = 8, pos = [], uv = [], idx = [];
  prof.forEach((p, i) => { for (let k = 0; k <= NX; k++) { pos.push(-X / 2 + X * k / NX, p[0] - 0.6, p[1]); uv.push(k / NX, S[i] / total); } });
  for (let i = 0; i < prof.length - 1; i++) for (let k = 0; k < NX; k++) { const a = i * (NX + 1) + k, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const vC = sCurve / total, vW = (sCurve + radius * Math.PI / 2) / total;
  const tex = canvasTex(1024, 2048, (x, w, h) => {
    const yOf = v => h * (1 - v); // canvas y for profile v (flipY texture)
    const gr = x.createLinearGradient(0, yOf(0), 0, yOf(1));
    gr.addColorStop(0, `rgb(${floor})`); gr.addColorStop(vW, `rgb(${floor})`); gr.addColorStop(Math.min(1, vW + 0.1), wall); gr.addColorStop(Math.min(1, vW + 0.3), '#0d0d0e'); gr.addColorStop(1, '#050505');
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    const cy = yOf(vW + 0.08 + (1 - vW) * spot[1] * 0.2), cxp = w * spot[0];
    x.save(); x.translate(cxp, cy); x.scale(1, 1.6);
    const r = x.createRadialGradient(0, 0, 0, 0, 0, w * 0.22); r.addColorStop(0, glow); r.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = r; x.beginPath(); x.arc(0, 0, w * 0.22, 0, Math.PI * 2); x.fill(); x.restore();
    if (warm) { x.save(); x.translate(0, yOf(vW + 0.12) - h * 0.2); bokeh(x, w, h * 0.3); x.restore(); }
    dither(x, w, h);
  });
  tex.anisotropy = 8;
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, depthWrite: false }));
}

// Out-of-focus restaurant lights: soft amber discs, pre-blurred (the stand stays in focus; this is the room behind it).
export function bokeh(x, w, h, seed = 7) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const cx = rnd() * w, cy = h * (0.18 + rnd() * 0.5), r = w * (0.02 + rnd() * 0.06), a = 0.05 + rnd() * 0.16;
    const hue = 28 + rnd() * 14, g = x.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    g.addColorStop(0, `hsla(${hue},90%,62%,${a})`); g.addColorStop(0.75, `hsla(${hue},90%,58%,${a * 0.8})`); g.addColorStop(1, 'hsla(30,90%,50%,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  }
  x.restore();
}
function dither(x, w, h) {
  const d = x.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const n = (Math.random() - 0.5) * 3; p[i] += n; p[i + 1] += n; p[i + 2] += n; }
  x.putImageData(d, 0, 0);
}

// Glossy dark tabletop: the reflection is a mirrored copy of the scene objects drawn under a
// semi-transparent surface that gets more opaque away from the contact point (Fresnel-ish falloff).
export function makeTable({ color = [10, 10, 11], pool = [0.5, 0.42], poolColor = 'rgba(58,58,62,0.55)', reflect = 0.5, warm = false } = {}) {
  const tex = canvasTex(1024, 1024, (x, w, h) => {
    x.fillStyle = `rgb(${color})`; x.fillRect(0, 0, w, h);
    const r = x.createRadialGradient(w * pool[0], h * pool[1], 0, w * pool[0], h * pool[1], w * 0.45);
    r.addColorStop(0, poolColor); r.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h);
    if (warm) { const q = x.createRadialGradient(w * 0.5, h * 0.1, 0, w * 0.5, h * 0.1, w * 0.6); q.addColorStop(0, 'rgba(120,70,30,0.35)'); q.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = q; x.fillRect(0, 0, w, h); }
    dither(x, w, h);
    // alpha: how much of the surface colour covers the reflection (less near the objects)
    const d = x.getImageData(0, 0, w, h), p = d.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const dx = (i / w - 0.5) * 2, dz = (j / h - 0.5) * 2, dist = Math.sqrt(dx * dx * 0.6 + dz * dz);
      p[(j * w + i) * 4 + 3] = 255 * Math.min(1, (1 - reflect) + dist * 0.9);
    }
    x.putImageData(d, 0, 0);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 1;
  return m;
}

// Soft contact shadow under an object: blurred rounded rect, multiplied onto the table.
export function contactShadow(w, d, { blur = 0.35, opacity = 0.85 } = {}) {
  const pad = 1 + blur * 2;
  const tex = canvasTex(512, 512, (x, W, H) => {
    x.filter = `blur(${Math.round(W * blur / pad / 2.2)}px)`;
    x.fillStyle = '#000'; x.beginPath(); x.roundRect(W * (1 - 1 / pad) / 2, H * (1 - 1 / pad) / 2, W / pad, H / pad, 30); x.fill();
  }, false);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * pad, d * pad), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, color: 0x000000 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.2; m.renderOrder = 2;
  return m;
}

// Mirror copy of an object for the table reflection.
export function mirrorOf(obj) {
  const g = new THREE.Group(); g.scale.y = -1; g.add(obj.clone()); return g;
}

export const ease = {
  inOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  expo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
};
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;

// Direct light for the printed ink and the white finish (reflections come from the environment).
export function addKeyLights(scene, mood = 'studio') {
  const warm = mood === 'warm';
  const key = new THREE.DirectionalLight(warm ? 0xffe6c7 : 0xffffff, warm ? 2.0 : 2.3); key.position.set(-500, 900, 900);
  const fill = new THREE.DirectionalLight(warm ? 0xffc996 : 0xdfe6ff, warm ? 0.5 : 0.45); fill.position.set(700, 300, 500);
  const amb = new THREE.HemisphereLight(0xffffff, 0x111111, warm ? 0.25 : 0.3);
  scene.add(key, fill, amb);
  return { key, fill, amb };
}
