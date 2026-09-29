// Render a shot to frames/PNG or straight to an MP4.
//   node render.mjs --shot test --still 0.5 --out out/test.png
//   node render.mjs --shot hero --fps 30 --out clips/hero.mp4 [--from 0 --to 3.2] [--w 1080 --h 1920] [--k v=1]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './server.mjs';

export const FFMPEG = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export async function openStage({ shot, w = 1080, h = 1920, params = {}, port }) {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  const qs = new URLSearchParams({ shot, w, h, ...params });
  await page.goto(`http://127.0.0.1:${port}/web/stage.html?${qs}`);
  await page.waitForFunction('window.ready === true', null, { timeout: 180000 });
  return { browser, page, duration: await page.evaluate('window.duration') };
}

export async function renderShot({ shot, out, fps = 30, from = 0, to, w = 1080, h = 1920, params = {}, still, crf = 14, log = true, jpeg = true }) {
  const { server, port } = await serve();
  const { browser, page, duration } = await openStage({ shot, w, h, params, port });
  try {
    if (still !== undefined) {
      await page.evaluate(t => window.frame(t), still);
      await page.screenshot({ path: out, type: out.endsWith('.jpg') ? 'jpeg' : 'png', quality: out.endsWith('.jpg') ? 95 : undefined });
      return;
    }
    const end = to ?? duration, n = Math.round((end - from) * fps);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', jpeg ? 'mjpeg' : 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-tune', 'film', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.frame(t), from + i / fps);
      const buf = await page.screenshot(jpeg ? { type: 'jpeg', quality: 96 } : { type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (log && (i % 30 === 0 || i === n - 1)) process.stderr.write(`\r${shot} ${i + 1}/${n}  ${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/frame   `);
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
    if (log) process.stderr.write('\n');
  } finally {
    await browser.close(); server.close();
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const a = process.argv.slice(2), o = { params: {} };
  for (let i = 0; i < a.length; i += 2) {
    const k = a[i].replace(/^--/, ''), v = a[i + 1];
    if (k === 'k') { const [pk, pv] = v.split('='); o.params[pk] = pv; } else o[k] = ['fps', 'from', 'to', 'w', 'h', 'still', 'crf'].includes(k) ? Number(v) : v;
  }
  const t0 = Date.now();
  await renderShot(o);
  console.error(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${o.out}`);
}
