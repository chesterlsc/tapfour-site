// 30 s REEL · 9:16. Same story, one beat per idea: problem → Review → tap → page → Connect → menu control → numbers → CTA.
export default {
  name: 'reel30', fmt: '9x16', w: 1080, h: 1920, file: 'tapfour-reel-30s',
  segments: [['open', 0, 3.0, 'hook'], ['open', 9.35, 12.0, 'reveal'], ['tap', 0.9, 3.9], ['screen', 0.4, 4.3], ['connect', 1.8, 4.4],
    ['scan', 1.0, 3.6], ['sync', 1.0, 3.4], ['dash', 0.3, 3.1], ['finale', 0.3, 2.1, 'finish'], ['finale', 4.0, 9.5, 'end']],
  cues: [
    { at: 'hook', t: -0.2, out: 2.95, kind: 'text', y: 440, dur: 0.5, lines: [['h1', 'Great meal.'], ['h1 dim', 'No review.', 1.0]] },
    { at: 'reveal', t: 9.45, out: 11.95, kind: 'text', y: 430, lines: [['h1', 'Tapfour Review'], ['mono', 'NFC Google review stand', 0.3]] },
    { at: 'tap', t: 1.0, out: 3.85, kind: 'text', y: 400, lines: [['h2', 'Guests tap'], ['h2', 'their phone.', 0.15]] },
    { at: 'screen', t: 0.5, out: 4.25, kind: 'text', y: 230, lines: [['h2', 'Your Google'], ['h2', 'review page opens.', 0.12]] },
    { at: 'screen', t: 1.4, out: 4.25, kind: 'tag', x: 0, y: 1745, text: 'NO APP · NO SEARCHING' },
    { at: 'screen', t: 0.6, out: 4.25, kind: 'legal', y: 428, text: 'Simulated screen' },
    { at: 'connect', t: 1.9, out: 4.35, kind: 'text', y: 400, lines: [['h1', 'Tapfour Connect'], ['mono', 'Review + live QR menu + dashboard', 0.3]] },
    { at: 'scan', t: 1.05, out: 3.55, kind: 'text', y: 250, lines: [['h2', 'Scan for your'], ['h2 lime', 'live menu.', 0.12]] },
    { at: 'sync', t: 1.0, out: 3.4, kind: 'scrim', side: 'top', h: 560 },
    { at: 'sync', t: 1.05, out: 3.35, kind: 'text', y: 250, lines: [['h2', 'Sold out?'], ['sub', 'Tap once. No reprint.', 0.2]] },
    { at: 'dash', t: 0.4, out: 3.05, kind: 'text', y: 235, lines: [['h3', 'Every tap and scan,'], ['h3', 'counted.', 0.12]] },
    { at: 'dash', t: 0.6, out: 3.05, kind: 'legal', y: 392, text: 'Sample data' },
    { at: 'finish', t: 0.35, out: 2.05, kind: 'text', y: 400, lines: [['h2', 'Glossy black'], ['h2', 'or white.', 0.12]] },
    { at: 'end', t: 4.5, out: 9.6, kind: 'endcard', y: 560, sub: 'Tapfour Review · Tapfour Connect', cta: 'Order at tap4.ph', fine: 'Programmed before it ships' },
    { at: 'end', t: 5.2, out: 9.6, kind: 'legal', y: 1110, text: 'Reviews are written by your guests. Some screens simulated; dashboard shows sample data.' }
  ],
  music: {
    bpm: 96, grid0: { at: 'reveal', t: 9.35 }, end: { at: 'end', t: 4.2 }, fadeOut: 2.2,
    levels: [[{ at: 'hook', t: 0 }, 0], [{ at: 'reveal', t: 9.35 }, 1], [{ at: 'tap', t: 2.15 }, 2], [{ at: 'connect', t: 1.8 }, 3], [{ at: 'dash', t: 0.3 }, 4], [{ at: 'finish', t: 0.3 }, 3]]
  },
  sfx: [
    { at: 'hook', t: 0.82, kind: 'tap', gain: 0.35 },
    { at: 'hook', t: 1.6, kind: 'riser', dur: 1.4, gain: 0.8 },
    { at: 'reveal', t: 9.35, kind: 'impact' },
    { at: 'tap', t: 0.95, kind: 'whoosh', dur: 1.0, gain: 0.4, pan: 0.3 },
    { at: 'tap', t: 2.15, kind: 'tap' }, { at: 'tap', t: 2.28, kind: 'nfc' },
    { at: 'screen', t: 0.55, kind: 'tick' }, { at: 'screen', t: 0.75, kind: 'reload' },
    ...[0, 1, 2, 3, 4].map(n => ({ at: 'screen', t: 1.95 + n * 0.13, kind: 'star', n })),
    { at: 'screen', t: 2.95, kind: 'type', dur: 1.2 },
    { at: 'connect', t: 1.8, kind: 'whoosh', dur: 0.6, gain: 0.5 },
    { at: 'scan', t: 1.12, kind: 'focus' }, { at: 'scan', t: 2.05, kind: 'tick' }, { at: 'scan', t: 2.22, kind: 'whoosh', dur: 0.45, gain: 0.35 },
    { at: 'sync', t: 1.5, kind: 'tick', pan: -0.3 }, { at: 'sync', t: 2.2, kind: 'reload', pan: 0.3 }, { at: 'sync', t: 2.58, kind: 'success', gain: 0.6, pan: 0.3 },
    ...Array.from({ length: 10 }, (_, i) => ({ at: 'dash', t: 0.55 + i * 0.12, kind: 'count' })),
    { at: 'finish', t: 0.3, kind: 'whoosh', dur: 0.5, gain: 0.4 },
    { at: 'end', t: 4.0, kind: 'whoosh', dur: 1.0, gain: 0.45 }, { at: 'end', t: 4.5, kind: 'logo' }
  ]
};
