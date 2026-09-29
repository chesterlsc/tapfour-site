// TAP4.1 L-Stand: one glossy PVC sheet, 70 mm wide, bent into an L (≈105 H × 70 W × 40 D mm).
// Built flat (u across, v along the sheet, w through its thickness) and bent around the x axis,
// so the bend, the rounded corners and the eased edges are one continuous surface. Units: mm.
import * as THREE from 'three';
import { faceArt } from './art.js';

export const DIM = { W: 70, H: 105, D: 40, t: 3, rIn: 2.2, recline: 10 * Math.PI / 180, rTop: 5.5, rBack: 2.5, fillet: 0.55 };

export function standLayout(o = {}) {
  const d = { ...DIM, ...o };
  const rOut = d.rIn + d.t, rho = d.rIn + d.t / 2, theta = Math.PI / 2 + d.recline;
  const baseLen = d.D - rOut, bendLen = rho * theta;
  const faceLen = (d.H - rOut * (1 + Math.sin(d.recline))) / Math.cos(d.recline);
  return { ...d, rOut, rho, theta, baseLen, bendLen, faceLen, L: baseLen + bendLen + faceLen, faceStart: baseLen + bendLen };
}

// flat (u, v, w) → bent position + frame rotation angle φ
function bend(S, u, v, w) {
  const r = S.rOut - w;
  if (v <= S.baseLen) return { p: [u, w, v - S.baseLen], phi: 0 };
  if (v <= S.faceStart) { const phi = (v - S.baseLen) / S.rho; return { p: [u, S.rOut - r * Math.cos(phi), r * Math.sin(phi)], phi }; }
  const s = v - S.faceStart, th = S.theta;
  return { p: [u, S.rOut - r * Math.cos(th) + s * Math.sin(th), r * Math.sin(th) + s * Math.cos(th)], phi: th };
}
// local (nu, nv, nw) → world normal for frame angle φ. e_v = (0, sinφ, cosφ), e_w = (0, cosφ, −sinφ)
const rotN = (nu, nv, nw, phi) => [nu, nv * Math.sin(phi) + nw * Math.cos(phi), nv * Math.cos(phi) - nw * Math.sin(phi)];

// Closed outline of the sheet inset by `ins`: rounded back corners (v = 0) and top corners (v = L).
function outline(S, ins) {
  const hw = S.W / 2, pts = [];
  const arc = (cu, cv, r, a0, a1, n) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push({ u: cu + r * Math.cos(a), v: cv + r * Math.sin(a), nu: Math.cos(a), nv: Math.sin(a) }); } };
  const rb = S.rBack - ins, rt = S.rTop - ins;
  // counter-clockwise in (u, v): back edge → right side → top → left side
  arc(-hw + S.rBack, S.rBack, rb, Math.PI, 1.5 * Math.PI, 10);
  arc(hw - S.rBack, S.rBack, rb, 1.5 * Math.PI, 2 * Math.PI, 10);
  const vs = []; for (let v = S.rBack + 1; v < S.L - S.rTop - 0.5; v += (v > S.baseLen - 2 && v < S.faceStart + 2) ? 0.35 : 2.5) vs.push(v);
  for (const v of vs) pts.push({ u: hw - ins, v, nu: 1, nv: 0 });
  arc(hw - S.rTop, S.L - S.rTop, rt, 0, 0.5 * Math.PI, 18);
  arc(-hw + S.rTop, S.L - S.rTop, rt, 0.5 * Math.PI, Math.PI, 18);
  for (const v of vs.slice().reverse()) pts.push({ u: -hw + ins, v, nu: -1, nv: 0 });
  return pts;
}

export function standGeometry(o = {}) {
  const S = standLayout(o), f = S.fillet;
  const pos = [], nor = [], uv = [], idx = [], groups = [];
  const vert = (u, v, w, nl) => {
    const { p, phi } = bend(S, u, v, w);
    pos.push(...p); nor.push(...rotN(...nl, phi));
    uv.push((u + S.W / 2) / S.W, (v - S.faceStart) / S.faceLen);
    return pos.length / 3 - 1;
  };
  // Caps: rows across the sheet at every v where the outline has a point, so row ends sit on the outline.
  const ol = outline(S, f);
  const rowsV = [...new Set(ol.map(p => +p.v.toFixed(4)))].sort((a, b) => a - b);
  const halfAt = v => { // half-width of the inset outline at v
    let best = 0; for (const p of ol) if (Math.abs(p.v - v) < 1e-3) best = Math.max(best, Math.abs(p.u)); return best;
  };
  const COLS = 14;
  for (const [w, sign] of [[0, -1], [S.t, 1]]) {
    const start = idx.length, rowIdx = [];
    for (const v of rowsV) {
      const h = halfAt(v), row = [];
      for (let c = 0; c <= COLS; c++) row.push(vert(-h + 2 * h * c / COLS, v, w, [0, 0, sign]));
      rowIdx.push(row);
    }
    for (let r = 0; r < rowIdx.length - 1; r++) for (let c = 0; c < COLS; c++) {
      const a = rowIdx[r][c], b = rowIdx[r][c + 1], cc = rowIdx[r + 1][c], d = rowIdx[r + 1][c + 1];
      if (sign < 0) idx.push(a, cc, b, b, cc, d); else idx.push(a, b, cc, b, d, cc);
    }
    groups.push([start, idx.length - start, w === 0 ? 0 : 1]); // group 0 = printed side (front of face, underside of base)
  }
  // Edge: flat wall with eased (filleted) corners, swept around the outline.
  const prof = [];
  const FN = 5;
  for (let i = 0; i <= FN; i++) { const a = Math.PI / 2 * i / FN; prof.push({ n: -f + f * Math.sin(a), w: f - f * Math.cos(a), nn: Math.sin(a), nw: -Math.cos(a) }); }
  for (let i = 0; i <= FN; i++) { const a = Math.PI / 2 * i / FN; prof.push({ n: -f + f * Math.cos(a), w: S.t - f + f * Math.sin(a), nn: Math.cos(a), nw: Math.sin(a) }); }
  const start = idx.length, ring = ol.map(p => prof.map(q => vert(p.u + p.nu * (q.n + f), p.v + p.nv * (q.n + f), q.w, [p.nu * q.nn, p.nv * q.nn, q.nw])));
  for (let i = 0; i < ring.length; i++) {
    const A = ring[i], B = ring[(i + 1) % ring.length];
    for (let j = 0; j < prof.length - 1; j++) idx.push(A[j], B[j], A[j + 1], B[j], B[j + 1], A[j + 1]);
  }
  groups.push([start, idx.length - start, 1]);
  for (let i = 0; i < idx.length; i += 3) { const k = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = k; } // counter-clockwise from outside
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  for (const [s, c, m] of groups) g.addGroup(s, c, m);
  g.userData.layout = S;
  return g;
}

// A stand mesh. The print sits under the glossy surface, so both materials share the same clearcoat.
export function makeStand({ design = 'review', finish = 'black', qrData, anisotropy = 8 } = {}) {
  const geo = standGeometry();
  const S = geo.userData.layout;
  const tex = new THREE.CanvasTexture(faceArt({ design, finish, faceLen: S.faceLen, qrData }));
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = anisotropy;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const black = finish === 'black';
  const common = { roughness: black ? 0.22 : 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: black ? 0.035 : 0.05, envMapIntensity: 1 };
  const print = new THREE.MeshPhysicalMaterial({ ...common, map: tex });
  const body = new THREE.MeshPhysicalMaterial({ ...common, color: black ? 0x060607 : 0xeeedea });
  const mesh = new THREE.Mesh(geo, [print, body]);
  mesh.userData = { layout: S, design, finish, texture: tex };
  return mesh;
}

// Point on the printed face, in the stand's local space: x mm from centre, y mm from the face's top edge.
export function facePoint(S, x, yFromTop, out = 0) {
  const { p, phi } = bend(S, x, S.L - yFromTop, -out);
  const n = rotN(0, 0, -1, phi);
  return { p: new THREE.Vector3(...p), n: new THREE.Vector3(...n) };
}
