// Contact sheet of stills from a shot: node stills.mjs <shot> t1,t2,... [out.jpg] [key=val ...]
import { openStage, FFMPEG } from './render.mjs';
import { serve } from './server.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const [shot, times, out = `out/${shot}_sheet.jpg`, ...kv] = process.argv.slice(2);
const params = Object.fromEntries(kv.map(s => s.split('=')));
const w = +(params.w || 1080), h = +(params.h || 1920);
const { server, port } = await serve();
const { browser, page } = await openStage({ shot, port, params, w, h });
const ts = times.split(',').map(Number);
fs.mkdirSync('out/tmp', { recursive: true });
const files = [];
for (const [i, t] of ts.entries()) {
  await page.evaluate(x => window.frame(x), t);
  const f = `out/tmp/${shot}_${i}.png`; await page.screenshot({ path: f }); files.push(f);
}
await browser.close(); server.close();
// tile with ffmpeg: scale each to 360 wide, hstack
const inputs = files.flatMap(f => ['-i', f]);
const cols = Math.min(files.length, 5), rows = Math.ceil(files.length / cols);
const sw = 360, sh = Math.round(360 * h / w);
const layout = files.map((_, i) => `${(i % cols) * sw}_${Math.floor(i / cols) * sh}`).join('|');
const scale = files.map((_, i) => `[${i}:v]scale=${sw}:${sh}[s${i}]`).join(';');
if (files.length === 1) execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', files[0], '-vf', `scale=${sw}:${sh}`, '-q:v', '3', out]);
else execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${scale};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black`, '-q:v', '3', out]);
console.log(out);
