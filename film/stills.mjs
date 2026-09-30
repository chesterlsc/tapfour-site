// Quick look-dev stills: `node stills.mjs <outDir> Comp:frame [Comp:frame …]` (one bundle, many stills; 1080p).
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import { rmSync as rmBundle } from 'node:fs';
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [out, ...picks] = process.argv.slice(2);
const common = { inputProps: { scale: 1, fps: 30 }, browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', chromiumOptions: { gl: 'swangle' }, timeoutInMilliseconds: 180000, logLevel: 'error' };
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') });
const comps = {};
for (const p of picks) {
  const [id, frame] = p.split(':');
  comps[id] ??= await selectComposition({ serveUrl, id, ...common });
  const t0 = Date.now();
  await renderStill({ serveUrl, composition: comps[id], frame: Number(frame), output: path.join(out, `${id}-${frame}.jpg`), imageFormat: 'jpeg', jpegQuality: 90, ...common });
  console.log(p, Date.now() - t0, 'ms');
}
rmBundle(serveUrl, { recursive: true, force: true }); // the bundle holds a copy of public/
