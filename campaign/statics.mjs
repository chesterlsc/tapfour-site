// Render the static campaign assets: node statics.mjs [name,...]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openStage, FFMPEG } from './render.mjs';
import { serve } from './server.mjs';
import { FORMATS } from './plates.mjs';

const only = process.argv[2]?.split(',');
const list = (await import('./web/edits/statics.js')).default.filter(s => !only || only.includes(s.name));
fs.mkdirSync('deliverables/statics', { recursive: true }); fs.mkdirSync('out/tmp', { recursive: true });
const { server, port } = await serve();
for (const s of list) {
  const params = { ...(FORMATS[s.fmt]?.params?.[s.plate] || {}), ...s.params };
  const pl = await openStage({ shot: s.plate, port, w: s.w, h: s.h, params });
  await pl.page.evaluate(t => window.frame(t), s.T);
  await pl.page.screenshot({ path: `out/tmp/st_${s.name}_p.png` }); await pl.browser.close();
  const tl = await openStage({ shot: 'titles', port, w: s.w, h: s.h, params: { edit: 'statics:' + s.name } });
  await tl.page.evaluate(t => window.frame(t), 3);
  await tl.page.screenshot({ path: `out/tmp/st_${s.name}_t.png`, omitBackground: true }); await tl.browser.close();
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', `out/tmp/st_${s.name}_p.png`, '-i', `out/tmp/st_${s.name}_t.png`, '-filter_complex', '[0][1]overlay', `deliverables/statics/${s.name}.png`]);
  console.log('✓', s.name);
}
server.close();
