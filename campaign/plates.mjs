// Render the visual plates (no copy) for one format, skipping plates already rendered.
//   node plates.mjs [9x16|4x5] [--force] [only,these]
import fs from 'node:fs';
import { renderShot } from './render.mjs';

export const FORMATS = {
  '9x16': { w: 1080, h: 1920, params: {} },
  '1x1': { w: 1080, h: 1080, params: {} },
  '4x5': { w: 1080, h: 1350, params: { screen: { pw: 470, py: 105 }, dash: { pw: 470, py: 100 }, links: { pw: 470, py: 100 }, sync: { py: 70 }, finale: { ty: 118 } } }
};
export const PLATES = ['open', 'tap', 'screen', 'details', 'connect', 'scan', 'sync', 'dash', 'links', 'duo', 'finale'];

if (import.meta.url.endsWith(process.argv[1]?.split('/').pop())) await main();
async function main() {
const args = process.argv.slice(2), fmt = args.find(a => FORMATS[a]) || '9x16', force = args.includes('--force');
const only = args.find(a => a.includes(',') || PLATES.includes(a))?.split(',');
const F = FORMATS[fmt];
fs.mkdirSync(`clips/${fmt}`, { recursive: true });
for (const p of PLATES) {
  if (only && !only.includes(p)) continue;
  const out = `clips/${fmt}/${p}.mp4`;
  if (!force && fs.existsSync(out)) { console.error('skip', out); continue; }
  const t0 = Date.now();
  await renderShot({ shot: p, out: out + '.tmp.mp4', w: F.w, h: F.h, params: F.params[p] || {} });
  fs.renameSync(out + '.tmp.mp4', out);
  console.error(`✓ ${out} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}
}
