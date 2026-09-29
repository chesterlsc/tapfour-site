// QA stills: node qa.mjs Shot-tap:44 Shot-scan:200 ... → out/qa/<comp>-<frame>.png, plus a contact sheet out/qa/sheet.png
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const common = { inputProps: { scale: 1, fps: 30 }, browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', chromiumOptions: { gl: 'swangle' }, timeoutInMilliseconds: 600000, logLevel: 'error' };
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') });
mkdirSync(path.join(ROOT, 'out/qa'), { recursive: true });
const outs = [];
for (const arg of process.argv.slice(2)) {
  const [id, frame] = arg.split(':');
  const composition = await selectComposition({ serveUrl, id, ...common });
  const output = path.join(ROOT, `out/qa/${id}-${frame}.png`);
  await renderStill({ serveUrl, composition, frame: Number(frame), output, ...common });
  outs.push(output); console.log('  ' + path.relative(ROOT, output));
}
execFileSync('python3', ['-c', `
import sys
from PIL import Image
fs=sys.argv[1:]; W=960
ims=[Image.open(f).convert('RGB') for f in fs]; ims=[i.resize((W,int(i.height*W/i.width))) for i in ims]
H=max(i.height for i in ims); cols=2; rows=(len(ims)+1)//2
o=Image.new('RGB',(W*cols,H*rows),'#222')
for k,i in enumerate(ims): o.paste(i,((k%cols)*W,(k//cols)*H))
o.save('${path.join(ROOT, 'out/qa/sheet.png')}')`, ...outs]);
