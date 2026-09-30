// Storyboard: one frame per shot from the Film composition → out/storyboard.png (labelled with timecodes).
// `node storyboard.mjs` (after render.mjs has produced the screens). `--qa` also keeps full-size frames in out/frames/.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { rmSync as rmBundle } from 'node:fs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
// A representative moment in each shot (seconds into the film).
export const PICKS = [['open', 'Open', 5.2], ['reveal', 'Reveal', 9.4], ['tap', 'One tap', 19.6], ['scan', 'Scan', 29.9], ['order', 'Table ordering', 42.9], ['owner', 'Owner app', 57.0], ['setup', 'Done for you', 66.4], ['solo', 'Solo package', 81.8], ['end', 'End card', 88.2]];
const fps = 30;
const common = { inputProps: { scale: 1, fps }, browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', chromiumOptions: { gl: 'swangle' }, timeoutInMilliseconds: 600000, logLevel: 'error' };
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') });
const composition = await selectComposition({ serveUrl, id: 'Film', ...common });
mkdirSync(path.join(ROOT, 'out/frames'), { recursive: true });
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7).split(',');
for (const [id, , sec] of PICKS) {
  if (only && !only.includes(id)) continue;
  const frame = Math.round(sec * fps), rendered = path.join(ROOT, `out/frames/film/${String(frame).padStart(4, '0')}.jpg`);
  // Prefer the exact frame from the film render; otherwise render a still.
  if (existsSync(rendered)) copyFileSync(rendered, path.join(ROOT, `out/frames/${id}.png`));
  else await renderStill({ serveUrl, composition, frame, output: path.join(ROOT, `out/frames/${id}.png`), ...common });
  console.log('  frame', id);
}
execFileSync('python3', [path.join(ROOT, 'capture/contact.py'), JSON.stringify(PICKS)], { stdio: 'inherit', cwd: ROOT });
rmBundle(serveUrl, { recursive: true, force: true }); // the bundle holds a copy of public/
