// Build a finished film from an edit: plates → concat, title layer (alpha), score → composite + grain → MP4.
//   node build.mjs master [--titles-only] [--audio-only]
import fs from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { openStage, FFMPEG } from './render.mjs';
import { serve } from './server.mjs';
import { layout, total } from './web/edits/timing.js';

const name = process.argv[2] || 'master', flags = process.argv.slice(3);
const edit = (await import(`./web/edits/${name}.js?v=${Date.now()}`)).default;
const segs = layout(edit.segments), D = +total(segs).toFixed(3), fps = 30;
fs.mkdirSync('out', { recursive: true }); fs.mkdirSync('deliverables', { recursive: true });
const run = (args, opts = {}) => new Promise((res, rej) => { const p = spawn(FFMPEG, ['-y', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'], ...opts }); p.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())); if (opts.feed) opts.feed(p); });
const at = (ref) => { const s = segs.find(x => x.id === ref.at); return +(s.start - s.from + ref.t).toFixed(3); };

// 1 · plates
const base = `out/${name}.base.mp4`;
if (!flags.includes('--titles-only') && !flags.includes('--audio-only')) {
  for (const s of segs) {
    const f = `clips/${edit.fmt}/${s.plate}.mp4`;
    if (!fs.existsSync(f)) throw new Error(`missing plate ${f} (node plates.mjs ${edit.fmt})`);
  }
  const inputs = segs.flatMap(s => ['-i', `clips/${edit.fmt}/${s.plate}.mp4`]);
  const fc = segs.map((s, i) => `[${i}:v]trim=start=${s.from}:end=${s.to},setpts=PTS-STARTPTS,fps=${fps}[v${i}]`).join(';') + ';' + segs.map((_, i) => `[v${i}]`).join('') + `concat=n=${segs.length}:v=1:a=0[v]`;
  await run([...inputs, '-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', '-pix_fmt', 'yuv420p', base]);
  console.error('✓ base', base);
}

// 2 · title layer (transparent)
const titles = `out/${name}.titles.mov`;
if (!flags.includes('--audio-only')) {
  const { server, port } = await serve();
  const { browser, page } = await openStage({ shot: 'titles', port, params: { edit: name }, w: edit.w, h: edit.h });
  const n = Math.round(D * fps);
  await run(['-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-c:v', 'qtrle', '-pix_fmt', 'argb', titles], {
    feed: async p => {
      for (let i = 0; i < n; i++) {
        await page.evaluate(t => window.frame(t), i / fps);
        const buf = await page.screenshot({ type: 'png', omitBackground: true });
        if (!p.stdin.write(buf)) await new Promise(r => p.stdin.once('drain', r));
        if (i % 150 === 0) process.stderr.write(`\rtitles ${i}/${n}   `);
      }
      p.stdin.end();
    }
  });
  await browser.close(); server.close();
  console.error('\n✓ titles', titles);
}

// 3 · score + sound design
const m = edit.music;
const cues = {
  duration: D, bpm: m.bpm || 96, grid0: at(m.grid0), end: at(m.end), fadeOut: m.fadeOut || 2.2,
  levels: m.levels.map(([r, l]) => [at(r), l]),
  events: edit.sfx.map(e => ({ ...e, t: at(e) }))
};
fs.writeFileSync(`out/${name}.cues.json`, JSON.stringify(cues, null, 1));
execFileSync('python3', ['score.py', `out/${name}.cues.json`, `out/${name}.wav`], { stdio: 'inherit' });
if (flags.includes('--audio-only')) process.exit(0);

// 4 · composite: plates + titles, gentle grain, fades; H.264 High / AAC, faststart
const out = `deliverables/${edit.file || `tapfour-${name}`}.mp4`;
const fade = `fade=t=out:st=${(D - 0.6).toFixed(2)}:d=0.6`; // no fade-in: frame 1 must already hook
await run(['-i', base, '-i', titles, '-i', `out/${name}.wav`, '-filter_complex',
  `[0:v][1:v]overlay=format=auto,noise=c0s=5:c0f=t+u:c1s=2:c1f=t+u:c2s=2:c2f=t+u,${fade},format=yuv420p[v];[2:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]`,
  '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(edit.crf || 18), '-profile:v', 'high', '-level', '4.2',
  '-r', String(fps), '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-t', String(D), out]);
console.error(`✓ ${out} (${D.toFixed(1)} s)`);
