// Full build of the film, in dependency order:
//   1. viewfinder (the 3D scene from the phone camera, shown on screen) → public/screens/viewfinder
//   2. device screens (2D compositions of the captured UI)          → public/screens/<name>/NNNN.jpg
//   3. the film                                                     → out/tapfour-connect-<res>p<fps>.mp4 (+ audio stem)
// Flags: --scale 2 (4K) · --fps 30 · --only film|screens|pre · --shot tap (render one shot to out/shots/) · --concurrency 3
// Prerequisites: `npm run capture` (real UI captures), `node capture/artwork.mjs`, `python3 capture/plate.py`, `python3 audio/sound.py`.
import { bundle } from '@remotion/bundler';
import { renderFrames, renderMedia, selectComposition } from '@remotion/renderer';
import { parseArgs } from 'node:util';
import { mkdirSync, rmSync, copyFileSync, existsSync, readdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const { values: a } = parseArgs({ options: { scale: { type: 'string', default: '1' }, fps: { type: 'string', default: '30' }, only: { type: 'string' }, shot: { type: 'string' }, concurrency: { type: 'string', default: '3' }, frames: { type: 'string' } } });
const scale = Number(a.scale), fps = Number(a.fps), concurrency = Number(a.concurrency);
const inputProps = { scale, fps };
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const chromiumOptions = { gl: 'swangle' };
const common = { inputProps, browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000, logLevel: 'error' };

const bundled = async () => bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') });
const comp = (serveUrl, id) => selectComposition({ serveUrl, id, ...common });
// onProgress is throttled, so log whenever another 25 frames are done rather than on exact multiples.
const progress = label => { let last = -1; return ({ renderedFrames = 0 }) => {
  if (Math.floor(renderedFrames / 25) !== last) { last = Math.floor(renderedFrames / 25); process.stdout.write(`\r  ${label}: ${renderedFrames}   `); }
}; };

async function frames(serveUrl, id, dir) {
  const composition = await comp(serveUrl, id);
  const out = path.join(ROOT, 'public/screens', dir);
  rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  await renderFrames({ serveUrl, composition, outputDir: out, imageFormat: 'jpeg', jpegQuality: 93, concurrency, imageSequencePattern: '[frame].[ext]', onFrameUpdate: n => { if (n % 25 === 0) process.stdout.write(`\r  ${id}: ${n}/${composition.durationInFrames}   `); }, onStart: () => {}, ...common });
  // [frame] is zero-padded to the composition's digit count; normalise to 4 digits + .jpg
  for (const f of readdirSync(out)) { const m = f.match(/^(\d+)\.jpe?g$/); if (m) renameSync(path.join(out, f), path.join(out, String(Number(m[1])).padStart(4, '0') + '.jpg')); }
  console.log(`\r  ${id} → public/screens/${dir} (${composition.durationInFrames} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

const SCREENS = [['ScreenTap', 'tap'], ['ScreenScan', 'scan'], ['ScreenOrderGuest', 'order'], ['ScreenOrderTablet', 'order-tablet'], ['ScreenDash', 'dash'], ['ScreenSetupPhone', 'setup-phone'], ['ScreenSetupTablet', 'setup-tablet']];

let serveUrl = await bundled();
if (!a.only || a.only === 'pre') {
  console.log('1 · viewfinder');
  await frames(serveUrl, 'Viewfinder', 'viewfinder');
  serveUrl = await bundled();
}
if (!a.only || a.only === 'screens') {
  console.log('2 · device screens');
  for (const [id, dir] of SCREENS) if (!a.frames || a.frames.split(',').includes(dir)) await frames(serveUrl, id, dir);
  serveUrl = await bundled();
}
if (a.shot) {
  const composition = await comp(serveUrl, `Shot-${a.shot}`);
  mkdirSync(path.join(ROOT, 'out/shots'), { recursive: true });
  await renderMedia({ serveUrl, composition, codec: 'h264', crf: 18, pixelFormat: 'yuv420p', outputLocation: path.join(ROOT, `out/shots/${a.shot}.mp4`), concurrency, onProgress: progress(a.shot), ...common });
  console.log(`\n  → out/shots/${a.shot}.mp4`);
} else if (!a.only || a.only === 'film') {
  // The film renders in chunks of 150 frames, each in a fresh browser (long-lived software-GL sessions slow down),
  // into out/frames/film/NNNN.jpg — so a stopped render resumes where it left off — then ffmpeg encodes it.
  console.log('3 · film');
  const composition = await comp(serveUrl, 'Film');
  const name = `tapfour-connect-${composition.height}p${fps}`;
  const dir = path.join(ROOT, 'out/frames/film');
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now(), N = composition.durationInFrames, CH = 150;
  const have = f => existsSync(path.join(dir, String(f).padStart(4, '0') + '.jpg'));
  for (let s0 = 0; s0 < N; s0 += CH) {
    const s1 = Math.min(N, s0 + CH) - 1;
    if (Array.from({ length: s1 - s0 + 1 }, (_, k) => s0 + k).every(have)) continue;
    const tmp = path.join(dir, `.chunk-${s0}`); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp);
    const c0 = Date.now();
    await renderFrames({ serveUrl, composition, outputDir: tmp, imageFormat: 'jpeg', jpegQuality: 95, concurrency, frameRange: [s0, s1], imageSequencePattern: '[frame].[ext]', onFrameUpdate: () => {}, onStart: () => {}, ...common });
    for (const f of readdirSync(tmp)) { const m = f.match(/^(\d+)\.jpe?g$/); if (m) renameSync(path.join(tmp, f), path.join(dir, String(Number(m[1])).padStart(4, '0') + '.jpg')); }
    rmSync(tmp, { recursive: true, force: true });
    console.log(`  frames ${s0}–${s1} (${((Date.now() - c0) / (s1 - s0 + 1) / 1000).toFixed(1)} s/frame)`);
  }
  const stem = path.join(ROOT, 'public/audio/tapfour-connect.wav');
  const bin = path.join(ROOT, 'node_modules/@remotion/compositor-linux-x64-gnu');
  execFileSync(path.join(bin, 'ffmpeg'), ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, '%04d.jpg'), ...(existsSync(stem) ? ['-i', stem] : []),
    '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart',
    ...(existsSync(stem) ? ['-c:a', 'aac', '-b:a', '256k', '-shortest'] : []), path.join(ROOT, `out/${name}.mp4`)], { stdio: 'inherit', env: { ...process.env, LD_LIBRARY_PATH: bin } });
  if (existsSync(stem)) copyFileSync(stem, path.join(ROOT, 'out/tapfour-connect-audio.wav'));
  console.log(`  → out/${name}.mp4 (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
}
