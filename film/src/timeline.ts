// Every timing in the film lives here, in seconds. Frame rate and resolution are parameters:
// render at 4K with `node render.mjs --scale 2` (all layout is in 1920×1080 design units, scaled at the root).

export const DESIGN = { width: 1920, height: 1080 };
export const DEFAULT_FPS = 30;

export type ShotId = 'open' | 'reveal' | 'tap' | 'scan' | 'order' | 'owner' | 'setup' | 'solo' | 'end';

export const SHOTS: { id: ShotId; start: number; end: number; label: string }[] = [
  { id: 'open', start: 0, end: 7, label: 'Open' },
  { id: 'reveal', start: 7, end: 12, label: 'Reveal' },
  { id: 'tap', start: 12, end: 22, label: 'One tap' },
  { id: 'scan', start: 22, end: 32, label: 'Scan' },
  { id: 'order', start: 32, end: 52, label: 'Table ordering' },
  { id: 'owner', start: 52, end: 64, label: 'Owner app' },
  { id: 'setup', start: 64, end: 74, label: 'Done for you' },
  { id: 'solo', start: 74, end: 84, label: 'Solo package' },
  { id: 'end', start: 84, end: 90, label: 'End card' }
];
export const FILM_SECONDS = 90;
// Shots overlap by this much for cross-dissolves (the outgoing shot keeps rendering under the incoming one).
export const XFADE = 0.7;

// Supers, in seconds relative to the start of their shot. Each holds ≥ 1.5 s and enters with a fade + 8 px rise.
export type Super = { text: string; sub?: string; tag?: string; at: number; out: number; pos?: 'left' | 'center' | 'right' | 'bottom' };
export const SUPERS: Record<ShotId, Super[]> = {
  open: [],
  reveal: [{ text: 'Reviews.\nMenu.\nOrders.\nOne stand.', at: 0.9, out: 4.7, pos: 'left' }],
  tap: [
    { text: 'One tap.', at: 1.6, out: 4.4, pos: 'left' },
    { text: 'Your Google review.\nInstantly.', at: 6.2, out: 9.6, pos: 'left' }
  ],
  scan: [{ text: 'Scan.\nA menu that’s alive.', at: 1.2, out: 9.5, pos: 'left' }],
  order: [
    { text: 'Order from\nthe table.', tag: 'TABLE ORDERING · ADD-ON', at: 1.0, out: 7.4, pos: 'left' },
    { text: 'Straight to\nyour staff.', at: 9.0, out: 15.6, pos: 'left' }
  ],
  owner: [
    { text: 'Meet the\ntapfour app.', at: 0.8, out: 5.4, pos: 'left' },
    { text: 'Know your\nbusiest hours.', at: 6.0, out: 11.5, pos: 'left' }
  ],
  setup: [{ text: 'We set it\nall up.', sub: 'Google Business Profile · Website · Menu', at: 0.6, out: 9.5, pos: 'left' }],
  solo: [],
  end: []
};

// Beats inside shots (seconds relative to the shot start) — screens, SFX and camera moves all read these.
export const BEATS = {
  open: { lockup: 4.0 },
  tap: { contact: 1.35, banner: 1.6, browser: 2.5, redirect: 4.1, sheet: 4.6, stars: 5.6, starStep: 0.32 },
  scan: { lock: 2.6, pill: 3.0, tapPill: 3.9, menuUp: 4.1, soldOut: 6.3, price: 7.3 },
  order: { add1: 1.7, add2: 3.3, add3: 4.7, place: 6.2, cutTablet: 7.6, toast: 8.6, open: 10.4, accept: 12.1, cutPhone: 13.8, preparing: 15.4 },
  owner: { count: 0.4, bars: 1.1, split: 3.4 },
  setup: { gbpAfter: 1.4, cutWeb: 3.4, cutMenu: 6.6, paste: 7.3, added: 8.4 },
  solo: { land: [0.9, 1.6, 2.3, 3.0, 3.8], card: 5.4 }
} as const;

export const shot = (id: ShotId) => SHOTS.find(s => s.id === id)!;
