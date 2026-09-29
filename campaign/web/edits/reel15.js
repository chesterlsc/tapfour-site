// 15 s PERFORMANCE REEL · 9:16. Hook → tap → result → the software → CTA. Built for paid placement.
export default {
  name: 'reel15', fmt: '9x16', w: 1080, h: 1920, file: 'tapfour-reel-15s',
  segments: [['open', 0, 2.5, 'hook'], ['tap', 1.0, 3.6], ['screen', 0.6, 3.1], ['sync', 1.0, 3.3], ['finale', 4.0, 9.2, 'end']],
  cues: [
    { at: 'hook', t: -0.2, out: 2.45, kind: 'text', y: 440, dur: 0.45, lines: [['h1', 'Great meal.'], ['h1 dim', 'No review.', 0.9]] },
    { at: 'tap', t: 1.05, out: 3.55, kind: 'text', y: 400, lines: [['h1', 'One tap.']] },
    { at: 'screen', t: 0.65, out: 3.05, kind: 'text', y: 230, lines: [['h2', 'Your Google'], ['h2', 'review page opens.', 0.12]] },
    { at: 'screen', t: 0.7, out: 3.05, kind: 'legal', y: 428, text: 'Simulated screen' },
    { at: 'sync', t: 1.0, out: 3.3, kind: 'scrim', side: 'top', h: 560 },
    { at: 'sync', t: 1.05, out: 3.25, kind: 'text', y: 250, lines: [['h2', 'Plus a live menu'], ['h2 lime', 'you control.', 0.12]] },
    { at: 'end', t: 4.5, out: 9.3, kind: 'endcard', y: 560, sub: 'Tapfour Review · Tapfour Connect', cta: 'Order at tap4.ph', fine: 'Glossy black or white' },
    { at: 'end', t: 5.0, out: 9.3, kind: 'legal', y: 1110, text: 'Reviews are written by your guests. Some screens simulated.' }
  ],
  music: {
    bpm: 96, grid0: { at: 'tap', t: 2.15 }, end: { at: 'end', t: 4.3 }, fadeOut: 1.6,
    levels: [[{ at: 'hook', t: 0 }, 0], [{ at: 'tap', t: 1.0 }, 1], [{ at: 'tap', t: 2.15 }, 3], [{ at: 'sync', t: 1.0 }, 4]]
  },
  sfx: [
    { at: 'hook', t: 0.72, kind: 'tap', gain: 0.35 },
    { at: 'hook', t: 1.2, kind: 'riser', dur: 1.3, gain: 0.7 },
    { at: 'tap', t: 1.05, kind: 'whoosh', dur: 0.9, gain: 0.4, pan: 0.3 },
    { at: 'tap', t: 2.15, kind: 'tap' }, { at: 'tap', t: 2.28, kind: 'nfc' },
    { at: 'screen', t: 0.75, kind: 'reload' },
    ...[0, 1, 2, 3, 4].map(n => ({ at: 'screen', t: 1.95 + n * 0.13, kind: 'star', n })),
    { at: 'sync', t: 1.5, kind: 'tick', pan: -0.3 }, { at: 'sync', t: 2.2, kind: 'reload', pan: 0.3 }, { at: 'sync', t: 2.58, kind: 'success', gain: 0.6, pan: 0.3 },
    { at: 'end', t: 4.0, kind: 'whoosh', dur: 0.8, gain: 0.45 }, { at: 'end', t: 4.5, kind: 'logo' }
  ]
};
