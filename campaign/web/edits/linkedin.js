// LINKEDIN · 4:5, 1080 × 1350, ~55 s. Same story; copy framed for owners and operators, captions-first (autoplay is muted).
export default {
  name: 'linkedin', fmt: '4x5', w: 1080, h: 1350, file: 'tapfour-linkedin-4x5',
  segments: [['open', 0, 3.1, 'hook'], ['open', 3.2, 8.5, 'steps'], ['open', 9.3, 12.2, 'reveal'], ['tap', 0.6, 3.9], ['screen', 0.3, 5.3],
    ['details', 6.6, 9.2, 'trust'], ['connect', 1.7, 5.4], ['sync'], ['dash'], ['duo'], ['finale', 3.9, 9.5, 'end']],
  cues: [
    { at: 'hook', t: -0.2, out: 3.05, kind: 'text', y: 150, dur: 0.5, lines: [['h1', 'Great meal.'], ['h1 dim', 'No review.', 1.2]] },
    { at: 'steps', t: 3.2, out: 8.5, kind: 'shade', in: 0.3 },
    { at: 'steps', t: 3.4, out: 7.0, kind: 'steps', y: 170, title: 'To leave a Google review, a guest has to…', items: ['Open Google Maps', 'Search your restaurant', 'Find the right listing', 'Scroll to reviews', 'Tap “Write a review”'], stagger: 0.2, strike: 1.75 },
    { at: 'steps', t: 5.5, out: 7.0, kind: 'text', y: 890, lines: [['h3', 'That’s a lot to ask of a happy guest.']] },
    { at: 'steps', t: 7.1, out: 8.45, kind: 'text', y: 420, lines: [['h2', 'What if it took'], ['h2 lime', 'one tap?', 0.22]] },
    { at: 'reveal', t: 9.4, out: 12.1, kind: 'text', y: 130, lines: [['h1', 'Tapfour Review'], ['mono', 'NFC Google review stand', 0.3]] },
    { at: 'tap', t: 0.7, out: 3.85, kind: 'text', y: 100, lines: [['h2', 'Guests tap their phone.']] },
    { at: 'screen', t: 0.4, out: 5.25, kind: 'text', y: 70, lines: [['h3', 'Your Google review page opens.'], ['sub', 'No app. No searching.', 0.4]] },
    { at: 'screen', t: 0.6, out: 5.25, kind: 'legal', y: 1305, text: 'Simulated screen' },
    { at: 'trust', t: 6.7, out: 9.1, kind: 'text', y: 70, lines: [['h3', 'Reviews still come from your guests.'], ['h3 lime', 'Tapfour just removes the searching.', 0.35]] },
    { at: 'connect', t: 1.9, out: 5.3, kind: 'text', y: 110, lines: [['h1', 'Tapfour Connect'], ['mono', 'Review + live QR menu + dashboard', 0.3]] },
    { at: 'sync', t: 0, out: 9.0, kind: 'scrim', side: 'top', h: 420 },
    { at: 'sync', t: 0.25, out: 3.85, kind: 'text', y: 60, lines: [['h3', 'Sold out? Tap once.'], ['sub', 'Guests see it on their next look.', 0.3]] },
    { at: 'sync', t: 4.1, out: 8.85, kind: 'text', y: 60, lines: [['h3', 'New price? Change it in seconds.'], ['sub', 'No reprints. No PDF menus.', 0.3]] },
    { at: 'dash', t: 0.2, out: 3.0, kind: 'text', y: 70, lines: [['h3', 'Taps, scans and menu views.'], ['sub', 'Counted for you, every day.', 0.3]] },
    { at: 'dash', t: 3.2, out: 7.3, kind: 'text', y: 70, lines: [['h3', 'Busiest hours, bills, low stock.'], ['sub', 'One dashboard for the shop.', 0.3]] },
    { at: 'dash', t: 0.6, out: 7.3, kind: 'legal', y: 1305, text: 'Sample data' },
    { at: 'duo', t: 0.3, out: 6.85, kind: 'checks', y: 110, head: 'Built for restaurant owners', items: ['Google reviews, one tap away', 'A menu you can change anytime', 'A dashboard that shows what works'], stagger: 0.5 },
    { at: 'end', t: 4.5, out: 9.6, kind: 'endcard', y: 200, sub: 'Tapfour Review · Tapfour Connect', cta: 'Order at tap4.ph', fine: 'Glossy black or white · Programmed before it ships' },
    { at: 'end', t: 5.2, out: 9.6, kind: 'legal', y: 640, text: 'Reviews are written by your guests. Some screens simulated; dashboard shows sample data.' }
  ],
  music: {
    bpm: 96, grid0: { at: 'reveal', t: 9.35 }, end: { at: 'end', t: 4.2 }, fadeOut: 2.4,
    levels: [[{ at: 'hook', t: 0 }, 0], [{ at: 'reveal', t: 9.35 }, 1], [{ at: 'tap', t: 2.15 }, 2], [{ at: 'connect', t: 1.9 }, 3], [{ at: 'duo', t: 0 }, 4], [{ at: 'end', t: 3.9 }, 3]]
  },
  sfx: [
    { at: 'hook', t: 1.02, kind: 'tap', gain: 0.35 },
    ...[0, 1, 2, 3, 4].map(i => ({ at: 'steps', t: 3.75 + i * 0.2, kind: 'tick', gain: 0.7 })),
    { at: 'steps', t: 5.15, kind: 'swish' }, { at: 'steps', t: 7.1, kind: 'riser', dur: 1.4 },
    { at: 'reveal', t: 9.35, kind: 'impact' },
    { at: 'tap', t: 0.7, kind: 'whoosh', dur: 1.1, gain: 0.45, pan: 0.3 }, { at: 'tap', t: 2.15, kind: 'tap' }, { at: 'tap', t: 2.28, kind: 'nfc' },
    { at: 'screen', t: 0.55, kind: 'tick' }, { at: 'screen', t: 0.75, kind: 'reload' },
    ...[0, 1, 2, 3, 4].map(n => ({ at: 'screen', t: 1.95 + n * 0.13, kind: 'star', n })),
    { at: 'screen', t: 2.95, kind: 'type', dur: 1.5 }, { at: 'screen', t: 4.72, kind: 'tick' },
    { at: 'trust', t: 6.6, kind: 'whoosh', dur: 0.6, gain: 0.5 },
    { at: 'connect', t: 1.7, kind: 'whoosh', dur: 0.8, gain: 0.55 },
    { at: 'sync', t: 1.5, kind: 'tick', pan: -0.3 }, { at: 'sync', t: 2.2, kind: 'reload', pan: 0.3 }, { at: 'sync', t: 2.58, kind: 'success', gain: 0.6, pan: 0.3 },
    { at: 'sync', t: 4.6, kind: 'tick', pan: -0.3 }, { at: 'sync', t: 5.1, kind: 'type', dur: 0.7, pan: -0.3 }, { at: 'sync', t: 6.0, kind: 'tick', pan: -0.3 },
    { at: 'sync', t: 6.6, kind: 'reload', pan: 0.3 }, { at: 'sync', t: 6.98, kind: 'success', gain: 0.6, pan: 0.3 },
    ...Array.from({ length: 12 }, (_, i) => ({ at: 'dash', t: 0.55 + i * 0.12, kind: 'count' })),
    ...[0, 1, 2].map(i => ({ at: 'duo', t: 0.62 + i * 0.5, kind: 'tick', gain: 0.6 })),
    { at: 'end', t: 3.9, kind: 'whoosh', dur: 1.2, gain: 0.5 }, { at: 'end', t: 4.5, kind: 'logo' }
  ]
};
