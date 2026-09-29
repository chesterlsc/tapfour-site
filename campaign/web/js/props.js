// Props: a generic modern phone (no brand details) and a café cup. Units: mm.
import * as THREE from 'three';

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function planarUV(geo, w, h) {
  const p = geo.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

// Phone: 72 × 152 × 8 mm. Screen 68 × 147.15 mm (390 × 844 pt). Local axes: +y = top, +z = screen side.
export const PHONE = { W: 72, H: 152, T: 8, SW: 68, SH: 147.15 };
export function makePhone({ color = 0x2a2b2f } = {}) {
  const g = new THREE.Group();
  const bev = 1.4, depth = PHONE.T - 2 * bev;
  const body = new THREE.ExtrudeGeometry(roundedRect(PHONE.W - 2 * bev, PHONE.H - 2 * bev, 10), { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 6, curveSegments: 24 });
  body.translate(0, 0, -depth / 2);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 });
  const frame = new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0.85 });
  g.add(new THREE.Mesh(body, [glass, frame]));
  // back: frosted glass panel + camera block
  const back = planarUV(new THREE.ShapeGeometry(roundedRect(PHONE.W - 3, PHONE.H - 3, 9.5), 24), PHONE.W, PHONE.H);
  const backM = new THREE.Mesh(back, new THREE.MeshPhysicalMaterial({ color: 0x1b1c20, roughness: 0.55, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.4 }));
  backM.rotation.y = Math.PI; backM.position.z = -PHONE.T / 2 - 0.05; g.add(backM);
  const bump = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(30, 30, 8), { depth: 1.2, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 3 }), frame);
  bump.position.set(PHONE.W / 2 - 20, PHONE.H / 2 - 20, -PHONE.T / 2 - 1.7); g.add(bump);
  for (const [x, y] of [[-6.5, 6.5], [6.5, -6.5], [-6.5, -6.5]]) {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 1.6, 32), new THREE.MeshPhysicalMaterial({ color: 0x08080a, roughness: 0.05, clearcoat: 1 }));
    lens.rotation.x = Math.PI / 2; lens.position.set(PHONE.W / 2 - 20 + x, PHONE.H / 2 - 20 + y, -PHONE.T / 2 - 2.6); g.add(lens);
  }
  // screen: emissive image + a reflection-only glass layer on top
  const scrGeo = planarUV(new THREE.ShapeGeometry(roundedRect(PHONE.SW, PHONE.SH, 8.6), 24), PHONE.SW, PHONE.SH);
  const canvas = document.createElement('canvas'); canvas.width = 1170; canvas.height = 2532;
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const screen = new THREE.Mesh(scrGeo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = PHONE.T / 2 + 0.02; g.add(screen);
  const refl = new THREE.Mesh(scrGeo, new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  refl.position.z = PHONE.T / 2 + 0.06; g.add(refl);
  g.userData = { canvas, ctx: canvas.getContext('2d'), tex, screen, brightness: 1 };
  return g;
}

// Café cup + saucer: glossy white ceramic, coffee with a little crema.
export function makeCup() {
  const g = new THREE.Group();
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf1efea, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  const prof = [[0, 0], [22, 0], [24, 1.5], [25, 4], [33, 30], [38.5, 62], [40, 72], [40.6, 76], [39.6, 76.6], [38.2, 75], [36.6, 64], [31.5, 30], [26, 8], [0, 7]].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), ceramic); g.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(13, 3.4, 16, 40, Math.PI * 1.25), ceramic);
  handle.position.set(41, 44, 0); handle.rotation.z = -Math.PI * 0.62; g.add(handle);
  const crema = document.createElement('canvas'); crema.width = crema.height = 256;
  const c = crema.getContext('2d'), rg = c.createRadialGradient(128, 128, 10, 128, 128, 128);
  rg.addColorStop(0, '#6b4226'); rg.addColorStop(0.55, '#8a5a36'); rg.addColorStop(0.85, '#5a341c'); rg.addColorStop(1, '#2a160b');
  c.fillStyle = rg; c.fillRect(0, 0, 256, 256);
  const ct = new THREE.CanvasTexture(crema); ct.colorSpace = THREE.SRGBColorSpace;
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(37.5, 64), new THREE.MeshPhysicalMaterial({ map: ct, roughness: 0.25, clearcoat: 0.6 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 68; g.add(coffee);
  const sp = [[0, 0], [52, 0], [66, 3], [75, 8], [76, 9.5], [74.5, 10], [64, 6.5], [50, 4.2], [30, 4], [0, 4]].map(([x, y]) => new THREE.Vector2(x, y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(sp, 96), ceramic); g.add(saucer);
  cup.position.y = 4; handle.position.y += 4; coffee.position.y += 4;
  return g;
}
