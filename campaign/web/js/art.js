// Printed faces of the TAP4.1 L-Stand, redrawn from the product photos (mm on a 70 mm wide face).
// Positions are measured from the top of the face. 20 px per mm.
export const PX = 20;
export const LIME = '#c8f23c';

const G_PATHS = [
  ['#EA4335', 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'],
  ['#4285F4', 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'],
  ['#FBBC05', 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'],
  ['#34A853', 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z']
];
// Two-leaf tapfour mark (assets/favicon.svg), 23 × 22 units.
const LEAF_PATHS = ['M0 6H2.2A8.8 12.8 0 0 1 11 18.8V22H8.8A8.8 12.8 0 0 1 0 9.2Z', 'M12 14.8A8.8 12.8 0 0 1 20.8 2H23V5.2A8.8 12.8 0 0 1 14.2 18H12Z'];

export function drawG(ctx, cx, cy, d) {
  ctx.save(); ctx.translate(cx - d / 2, cy - d / 2); ctx.scale(d / 48, d / 48);
  for (const [c, p] of G_PATHS) { ctx.fillStyle = c; ctx.fill(new Path2D(p)); }
  ctx.restore();
}
export function drawLeaf(ctx, x, cy, h, color = LIME) {
  const s = h / 22; ctx.save(); ctx.translate(x, cy - h / 2); ctx.scale(s, s); ctx.fillStyle = color;
  for (const p of LEAF_PATHS) ctx.fill(new Path2D(p));
  ctx.restore(); return 23 * s;
}
export function drawNfc(ctx, cx, cy, h, color, lw) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  const x0 = cx - h * 0.28;
  [0.16, 0.3, 0.44, 0.58].forEach((r, i) => {
    const a = i === 0 ? 0.75 : 0.9;
    ctx.beginPath(); ctx.arc(x0, cy, r * h, -a, a); ctx.stroke();
  });
  ctx.restore();
}
function spaced(ctx, text, cx, y, size, spacing, font) {
  ctx.font = `${font} ${size}px 'JetBrains Mono'`;
  const w = [...text].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + spacing * (text.length - 1);
  let x = cx - w / 2;
  for (const ch of text) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + spacing; }
  return w;
}
function tight(ctx, text, cx, y, size, weight = 700, track = -0.045) {
  ctx.font = `${weight} ${size}px 'Instrument Sans'`;
  ctx.letterSpacing = `${track * size}px`;
  const w = ctx.measureText(text).width;
  ctx.fillText(text, cx - w / 2, y);
  ctx.letterSpacing = '0px';
  return w;
}
function powered(ctx, cx, y, fg) {
  const m = PX;
  ctx.fillStyle = fg;
  ctx.font = `500 ${1.75 * m}px 'JetBrains Mono'`;
  const sp = 0.62 * m, label = 'POWERED BY';
  const lw = [...label].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + sp * (label.length - 1);
  ctx.font = `700 ${4.3 * m}px 'Instrument Sans'`; ctx.letterSpacing = `${-0.03 * 4.3 * m}px`;
  const tw = ctx.measureText('tapfour').width; ctx.letterSpacing = '0px';
  const leaf = 3.9 * m * 23 / 22, gap1 = 2.6 * m, gap2 = 0.9 * m;
  let x = cx - (lw + gap1 + leaf + gap2 + tw) / 2;
  spaced(ctx, label, x + lw / 2, y, 1.75 * m, sp, 500);
  x += lw + gap1;
  drawLeaf(ctx, x, y - 1.05 * m, 3.9 * m);
  x += leaf + gap2;
  ctx.font = `700 ${4.3 * m}px 'Instrument Sans'`; ctx.letterSpacing = `${-0.03 * 4.3 * m}px`;
  ctx.fillText('tapfour', x, y + 0.45 * m); ctx.letterSpacing = '0px';
}
function qr(ctx, data, cx, cy, size, tile) {
  const m = PX, n = data.n, q = size / (n + (tile ? 3.2 : 0.6)), x0 = cx - n * q / 2, y0 = cy - n * q / 2;
  if (tile) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 1.4 * m); ctx.fill(); }
  ctx.fillStyle = '#0a0a0b';
  const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const hole = (r, c) => Math.abs(r - (n - 1) / 2) < 3.2 && Math.abs(c - (n - 1) / 2) < 3.2;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (data.m[r][c] !== '1' || finder(r, c) || hole(r, c)) continue;
    ctx.beginPath(); ctx.arc(x0 + (c + 0.5) * q, y0 + (r + 0.5) * q, q * 0.43, 0, Math.PI * 2); ctx.fill();
  }
  for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    const x = x0 + c * q, y = y0 + r * q;
    ctx.beginPath(); ctx.roundRect(x, y, 7 * q, 7 * q, 2.2 * q); ctx.roundRect(x + q, y + q, 5 * q, 5 * q, 1.5 * q); ctx.fill('evenodd');
    ctx.beginPath(); ctx.roundRect(x + 2 * q, y + 2 * q, 3 * q, 3 * q, 0.9 * q); ctx.fill();
  }
  drawLeaf(ctx, cx - 2.4 * q * 23 / 22, cy, 4.8 * q);
}

// design: 'review' | 'menu'; finish: 'black' | 'white'. faceLen in mm (the straight part of the face).
export function faceArt({ design = 'review', finish = 'black', faceLen = 101.4, qrData }) {
  const W = 70, m = PX;
  const cv = document.createElement('canvas');
  cv.width = W * m; cv.height = Math.round(faceLen * m);
  const ctx = cv.getContext('2d');
  const dark = finish === 'black', bg = dark ? '#060607' : '#f3f2ef', fg = dark ? '#f4f3ef' : '#0b0b0c';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.textBaseline = 'alphabetic'; ctx.fillStyle = fg;
  const cx = W / 2 * m, Y = mm => mm * m;
  if (design === 'review') {
    tight(ctx, 'Leave us a review', cx, Y(25.4), 7.25 * m);
    ctx.strokeStyle = dark ? LIME : '#0b0b0c'; ctx.lineWidth = (dark ? 0.62 : 0.4) * m;
    ctx.beginPath(); ctx.arc(cx, Y(49.5), 11.9 * m, 0, Math.PI * 2); ctx.stroke();
    drawG(ctx, cx, Y(49.5), 11 * m);
    drawNfc(ctx, cx + 0.6 * m, Y(68), 6.6 * m, fg, 0.58 * m);
    ctx.fillStyle = fg; spaced(ctx, 'TAP YOUR PHONE HERE', cx, Y(79.2), 2.15 * m, 0.95 * m, 500);
    powered(ctx, cx, Y(93.4), fg);
  } else {
    tight(ctx, 'Review or', cx, Y(19.6), 7.3 * m);
    tight(ctx, 'view our menu', cx, Y(27.4), 7.3 * m);
    const lx = W * 0.285 * m, rx = W * 0.705 * m, cy = Y(50.5);
    ctx.strokeStyle = dark ? LIME : '#0b0b0c'; ctx.lineWidth = (dark ? 0.55 : 0.36) * m;
    ctx.beginPath(); ctx.arc(lx, cy, 9.3 * m, 0, Math.PI * 2); ctx.stroke();
    drawG(ctx, lx, cy, 8.6 * m);
    ctx.fillStyle = fg; ctx.fillRect(W * 0.492 * m, Y(38.5), 0.22 * m, Y(32));
    qr(ctx, qrData, rx, cy - 0.2 * m, 22 * m, dark);
    ctx.fillStyle = fg;
    tight(ctx, 'Tap to review', lx, Y(66.3), 2.55 * m, 500, -0.01);
    tight(ctx, 'Scan for menu', rx, Y(66.3), 2.55 * m, 500, -0.01);
    spaced(ctx, 'TAP OR SCAN', cx, Y(80.5), 2.15 * m, 0.95 * m, 500);
    powered(ctx, cx, Y(93.4), fg);
  }
  return cv;
}
