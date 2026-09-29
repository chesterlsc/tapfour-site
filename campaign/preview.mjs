// Composite preview of an edit at given times: plate frame (from the rendered clip, or a live still) + title layer.
//   node preview.mjs master 1.5,6.2,14.8 [out.jpg]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openStage, FFMPEG } from './render.mjs';
import { serve } from './server.mjs';

const [name, times, out = `out/preview_${name}.jpg`] = process.argv.slice(2);
const edit = (await import(`./web/edits/${name}.js?v=${Date.now()}`)).default;
const { layout } = await import('./web/edits/timing.js');
const segs = layout(edit.segments), ts = times.split(',').map(Number);
const { server, port } = await serve();
fs.mkdirSync('out/tmp', { recursive: true });
const tl = await openStage({ shot: 'titles', port, params: { edit: name }, w: edit.w, h: edit.h });
const files = [];
for (const [i, t] of ts.entries()) {
  const s = segs.find(x => t >= x.start && t < x.start + x.len) || segs.at(-1), local = s.from + (t - s.start);
  const clip = `clips/${edit.fmt}/${s.plate}.mp4`, pf = `out/tmp/pv_p${i}.png`, tf = `out/tmp/pv_t${i}.png`, cf = `out/tmp/pv_c${i}.png`;
  if (fs.existsSync(clip)) execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', String(local), '-i', clip, '-frames:v', '1', pf]);
  else { const st = await openStage({ shot: s.plate, port, w: edit.w, h: edit.h }); await st.page.evaluate(x => window.frame(x), local); await st.page.screenshot({ path: pf }); await st.browser.close(); }
  await tl.page.evaluate(x => window.frame(x), t);
  await tl.page.screenshot({ path: tf, omitBackground: true });
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', pf, '-i', tf, '-filter_complex', '[0][1]overlay', cf]);
  files.push(cf);
}
await tl.browser.close(); server.close();
const sw = 360, sh = Math.round(sw * edit.h / edit.w), cols = Math.min(files.length, 5);
if (files.length === 1) execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', files[0], '-vf', `scale=${sw * 2}:${sh * 2}`, out]);
else execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex',
  files.map((_, i) => `[${i}:v]scale=${sw}:${sh}[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * sw}_${Math.floor(i / cols) * sh}`).join('|')}:fill=black`, '-q:v', '3', out]);
console.log(out);
