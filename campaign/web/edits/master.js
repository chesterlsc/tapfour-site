// MASTER · Instagram Reel 9:16, 1080 × 1920, ~81 s. Copy is sound-off first; every claim maps to shipped features.
// y = top of the text block in px (frame is 1920 tall). Cue times are on each plate's own clock.
export default {
  name: 'master', fmt: '9x16', w: 1080, h: 1920,
  segments: [['open'], ['tap'], ['screen'], ['details'], ['connect'], ['scan'], ['sync'], ['dash'], ['links'], ['duo'], ['finale']],
  cues: [
    // 0:00 hook
    { at: 'open', t: -0.2, out: 3.05, kind: 'text', y: 440, dur: 0.5, lines: [['h1', 'Great meal.'], ['h1 dim', 'No review.', 1.2]] },
    // the long way
    { at: 'open', t: 3.25, out: 8.1, kind: 'shade' },
    { at: 'open', t: 3.45, out: 7.0, kind: 'steps', y: 470, title: 'To leave you a Google review, a guest has to…', items: ['Open Google Maps', 'Search your restaurant', 'Find the right listing', 'Scroll to reviews', 'Tap “Write a review”'], stagger: 0.2, strike: 1.75 },
    { at: 'open', t: 5.55, out: 7.0, kind: 'text', y: 1190, lines: [['h3', 'That’s a lot to ask of a happy guest.']] },
    { at: 'open', t: 7.15, out: 8.55, kind: 'text', y: 600, lines: [['h2', 'What if it took'], ['h2 lime', 'one tap?', 0.22]] },
    // reveal
    { at: 'open', t: 9.4, out: 12.0, kind: 'text', y: 430, lines: [['h1', 'Tapfour Review'], ['mono', 'NFC Google review stand', 0.3]] },
    // the tap
    { at: 'tap', t: 0.35, out: 3.75, kind: 'text', y: 400, lines: [['h2', 'Guests tap'], ['h2', 'their phone.', 0.15]] },
    // review page
    { at: 'screen', t: 0.25, out: 5.45, kind: 'text', y: 230, lines: [['h2', 'Your Google'], ['h2', 'review page opens.', 0.12]] },
    { at: 'screen', t: 1.5, out: 5.45, kind: 'tag', x: 0, y: 1745, text: 'NO APP · NO SEARCHING' },
    { at: 'screen', t: 0.5, out: 5.45, kind: 'legal', y: 428, text: 'Simulated screen' },
    // the object
    { at: 'details', t: 0.2, out: 2.15, kind: 'scrim', side: 'top', h: 620 },
    { at: 'details', t: 0.25, out: 2.1, kind: 'text', y: 300, lines: [['h2', 'Glossy PVC.'], ['sub', 'Wipes clean. Fits any table or counter.', 0.25]] },
    { at: 'details', t: 2.4, out: 4.45, kind: 'scrim', side: 'bottom', h: 700 },
    { at: 'details', t: 2.45, out: 4.4, kind: 'text', y: 1330, lines: [['h2', 'Nothing to charge.'], ['sub', 'Passive NFC. No batteries, no Wi-Fi.', 0.25]] },
    { at: 'details', t: 4.8, out: 6.75, kind: 'text', y: 250, lines: [['h3', 'Arrives programmed to'], ['h3', 'your Google review page.', 0.12]] },
    { at: 'details', t: 6.9, out: 9.05, kind: 'text', y: 250, lines: [['h3', 'Reviews still come from your guests.'], ['h3 lime', 'Tapfour just removes the searching.', 0.35]] },
    // Tapfour Connect
    { at: 'connect', t: 0.1, out: 1.7, kind: 'text', y: 420, lines: [['h2', 'Need more'], ['h2', 'than reviews?', 0.12]] },
    { at: 'connect', t: 2.0, out: 5.25, kind: 'text', y: 400, lines: [['h1', 'Tapfour Connect'], ['mono', 'Review + live QR menu + dashboard', 0.3]] },
    // scan
    { at: 'scan', t: 0.2, out: 2.35, kind: 'text', y: 250, lines: [['h2', 'Tap to review.'], ['h2 lime', 'Scan for your menu.', 0.3]] },
    { at: 'scan', t: 2.6, out: 5.85, kind: 'text', y: 250, lines: [['h2', 'A live menu,'], ['h2', 'hosted for you.', 0.12]] },
    // owner control
    { at: 'sync', t: 0, out: 9.0, kind: 'scrim', side: 'top', h: 560 },
    { at: 'sync', t: 0.25, out: 3.85, kind: 'text', y: 250, lines: [['h2', 'Sold out?'], ['sub', 'Tap once. Guests see it on their next look.', 0.3]] },
    { at: 'sync', t: 4.1, out: 8.85, kind: 'text', y: 250, lines: [['h2', 'New price?'], ['sub', 'Change it in seconds. No reprint.', 0.3]] },
    { at: 'sync', t: 0.9, out: 2.3, kind: 'tag', x: -258, y: 1500, text: 'YOU' },
    { at: 'sync', t: 0.9, out: 2.3, kind: 'tag', x: 258, y: 1500, text: 'YOUR GUEST' },
    // dashboard
    { at: 'dash', t: 0.2, out: 3.0, kind: 'text', y: 235, lines: [['h3', 'Every tap and scan,'], ['h3', 'counted.', 0.12]] },
    { at: 'dash', t: 3.2, out: 5.4, kind: 'text', y: 235, lines: [['h3', 'Busiest hours. Bills due.'], ['h3', 'Low stock.', 0.12]] },
    { at: 'dash', t: 5.6, out: 7.3, kind: 'text', y: 235, lines: [['h3', 'See what guests'], ['h3', 'open most.', 0.12]] },
    { at: 'dash', t: 0.6, out: 7.3, kind: 'legal', y: 392, text: 'Sample data' },
    // links
    { at: 'links', t: 0.2, out: 3.4, kind: 'text', y: 235, lines: [['h3', 'Change where your'], ['h3', 'stand sends guests.', 0.12]] },
    { at: 'links', t: 3.65, out: 5.5, kind: 'text', y: 235, lines: [['h3', 'Every stand updates'], ['h3 lime', 'on the next tap.', 0.12]] },
    // value
    { at: 'duo', t: 0.3, out: 6.85, kind: 'checks', y: 380, head: 'Tapfour for restaurants', items: ['Google reviews, one tap away', 'A menu you can change anytime', 'A dashboard that shows what works'], stagger: 0.5 },
    // finishes + end card
    { at: 'finale', t: 0.3, out: 3.6, kind: 'text', y: 400, lines: [['h2', 'Glossy black'], ['h2', 'or white.', 0.15]] },
    { at: 'finale', t: 4.5, out: 9.6, kind: 'endcard', y: 560, sub: 'Tapfour Review · Tapfour Connect', cta: 'Order at tap4.ph', fine: 'Programmed before it ships' },
    { at: 'finale', t: 5.2, out: 9.6, kind: 'legal', y: 1110, text: 'Reviews are written by your guests. Some screens simulated; dashboard shows sample data.' }
  ],
  music: {
    bpm: 96, grid0: { at: 'open', t: 9.35 }, end: { at: 'finale', t: 4.2 }, fadeOut: 2.6,
    levels: [[{ at: 'open', t: 0 }, 0], [{ at: 'open', t: 9.35 }, 1], [{ at: 'tap', t: 2.15 }, 2], [{ at: 'connect', t: 1.9 }, 3], [{ at: 'duo', t: 0 }, 4], [{ at: 'finale', t: 0 }, 3]]
  },
  sfx: [
    { at: 'open', t: 1.02, kind: 'tap', gain: 0.35 },
    ...[0, 1, 2, 3, 4].map(i => ({ at: 'open', t: 3.8 + i * 0.2, kind: 'tick', gain: 0.7 })),
    { at: 'open', t: 5.2, kind: 'swish' },
    { at: 'open', t: 7.95, kind: 'riser', dur: 1.4 },
    { at: 'open', t: 9.35, kind: 'impact' },
    { at: 'tap', t: 0.3, kind: 'whoosh', dur: 1.3, gain: 0.45, pan: 0.3 },
    { at: 'tap', t: 2.15, kind: 'tap' },
    { at: 'tap', t: 2.28, kind: 'nfc' },
    { at: 'screen', t: 0.55, kind: 'tick' },
    { at: 'screen', t: 0.75, kind: 'reload' },
    ...[0, 1, 2, 3, 4].map(n => ({ at: 'screen', t: 1.95 + n * 0.13, kind: 'star', n })),
    { at: 'screen', t: 2.95, kind: 'type', dur: 1.5 },
    { at: 'screen', t: 4.72, kind: 'tick' },
    { at: 'details', t: 0, kind: 'whoosh', dur: 0.5, gain: 0.6 },
    { at: 'details', t: 2.3, kind: 'whoosh', dur: 0.5, gain: 0.5, pan: -0.3 },
    { at: 'details', t: 4.6, kind: 'whoosh', dur: 0.6, gain: 0.5, pan: 0.3 },
    { at: 'connect', t: 0.3, kind: 'whoosh', dur: 1.6, gain: 0.6 },
    { at: 'scan', t: 1.12, kind: 'focus' },
    { at: 'scan', t: 2.05, kind: 'tick' },
    { at: 'scan', t: 2.22, kind: 'whoosh', dur: 0.45, gain: 0.35 },
    { at: 'sync', t: 1.5, kind: 'tick', pan: -0.3 },
    { at: 'sync', t: 2.2, kind: 'reload', pan: 0.3 },
    { at: 'sync', t: 2.58, kind: 'success', gain: 0.6, pan: 0.3 },
    { at: 'sync', t: 4.6, kind: 'tick', pan: -0.3 },
    { at: 'sync', t: 5.1, kind: 'type', dur: 0.7, pan: -0.3 },
    { at: 'sync', t: 6.0, kind: 'tick', pan: -0.3 },
    { at: 'sync', t: 6.6, kind: 'reload', pan: 0.3 },
    { at: 'sync', t: 6.98, kind: 'success', gain: 0.6, pan: 0.3 },
    ...Array.from({ length: 12 }, (_, i) => ({ at: 'dash', t: 0.55 + i * 0.12, kind: 'count' })),
    { at: 'links', t: 1.35, kind: 'tick' },
    { at: 'links', t: 1.6, kind: 'type', dur: 1.1 },
    { at: 'links', t: 3.32, kind: 'tick' },
    { at: 'links', t: 3.6, kind: 'success' },
    ...[0, 1, 2].map(i => ({ at: 'duo', t: 0.62 + i * 0.5, kind: 'tick', gain: 0.6 })),
    { at: 'finale', t: 3.8, kind: 'whoosh', dur: 1.4, gain: 0.5 },
    { at: 'finale', t: 4.5, kind: 'logo' }
  ]
};
