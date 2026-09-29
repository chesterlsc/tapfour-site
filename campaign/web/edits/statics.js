// Statics: one plate frame + copy. Carousel 1080 × 1350 (6), feed 1080 × 1080, story 1080 × 1920.
// Each cue is shown fully revealed at the plate time T.
const car = (n, plate, T, cues, params = {}) => ({ name: `carousel-${n}`, fmt: '4x5', w: 1080, h: 1350, plate, T, cues, params });
export default [
  car(1, 'open', 11.9, [
    { kind: 'text', y: 110, lines: [['h1', 'Great meal.'], ['h1 dim', 'No review.']] },
    { kind: 'tag', x: 0, y: 360, text: 'SWIPE · HOW TAPFOUR FIXES IT →' }
  ]),
  car(2, 'open', 6.4, [
    { kind: 'shade' },
    { kind: 'steps', y: 150, title: 'To leave a Google review, a guest has to…', items: ['Open Google Maps', 'Search your restaurant', 'Find the right listing', 'Scroll to reviews', 'Tap “Write a review”'], stagger: 0, strike: 0.2 },
    { kind: 'text', y: 860, lines: [['h3', 'That’s a lot to ask of a happy guest.'], ['h3 lime', 'Tapfour makes it one tap.']] }
  ]),
  car(3, 'details', 8.3, [
    { kind: 'text', y: 70, lines: [['h2', 'Tapfour Review'], ['sub', 'One tap opens your Google review page.']] },
    { kind: 'tag', x: 0, y: 225, text: 'NO APP · NO BATTERIES · READY TO USE' }
  ], { zoom: 0.7 }),
  car(4, 'scan', 1.9, [
    { kind: 'text', y: 70, lines: [['h2', 'Tapfour Connect'], ['sub', 'Tap to review. Scan for your live menu.']] }
  ]),
  car(5, 'sync', 3.2, [
    { kind: 'scrim', side: 'top', h: 460 },
    { kind: 'text', y: 60, lines: [['h3', 'Sold out? New price?'], ['sub', 'Change your menu from your phone. No reprints.']] },
    { kind: 'legal', y: 1305, text: 'Real tapfour screens · sample café' }
  ], { py: 70 }),
  car(6, 'finale', 9.0, [
    { kind: 'endcard', y: 200, sub: 'Tapfour Review · Tapfour Connect', cta: 'Order at tap4.ph', fine: 'Glossy black or white' },
    { kind: 'legal', y: 640, text: 'Reviews are written by your guests.' }
  ], { ty: 118 }),
  { name: 'feed-1x1', fmt: '1x1', w: 1080, h: 1080, plate: 'duo', T: 3.5, params: { zoom: 0.7 }, cues: [
    { kind: 'text', y: 70, lines: [['h2', 'Google reviews,'], ['h2 lime', 'one tap away.']] },
    { kind: 'tag', x: 0, y: 990, text: 'ORDER AT TAP4.PH' }
  ] },
  { name: 'story-9x16', fmt: '9x16', w: 1080, h: 1920, plate: 'details', T: 8.3, params: { zoom: 0.74 }, cues: [
    { kind: 'text', y: 250, lines: [['h1', 'One tap to your'], ['h1 lime', 'Google reviews.']] },
    { kind: 'endcard', y: 1440, sub: 'Tapfour Review · Tapfour Connect', cta: 'Order at tap4.ph' }
  ] }
];
