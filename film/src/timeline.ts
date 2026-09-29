// Every timing in the film lives here, in seconds. Resolution and frame rate are parameters:
//   render.mjs --scale 2   → 3840×2160 (layouts are authored at 1920×1080 and scale with it)
//   render.mjs --fps 60
export const BASE_W = 1920;
export const BASE_H = 1080;
export const DURATION = 90;

export type ShotId = 'open' | 'reveal' | 'tap' | 'scan' | 'order' | 'owner' | 'done' | 'solo' | 'end';

// Shot windows. Neighbouring shots overlap by XFADE so each transition is a 0.6–1.2 s dissolve
// (a shot is rendered from `from - XFADE/2` to `to + XFADE/2`).
export const SHOTS: Record<ShotId, { from: number; to: number; label: string }> = {
  open: { from: 0, to: 7, label: 'Open' },
  reveal: { from: 7, to: 12, label: 'Reveal' },
  tap: { from: 12, to: 22, label: 'One tap' },
  scan: { from: 22, to: 32, label: 'Scan' },
  order: { from: 32, to: 52, label: 'Table ordering' },
  owner: { from: 52, to: 64, label: 'Owner app' },
  done: { from: 64, to: 74, label: 'Done for you' },
  solo: { from: 74, to: 84, label: 'Solo package' },
  end: { from: 84, to: 90, label: 'End card' },
};
export const SHOT_ORDER: ShotId[] = ['open', 'reveal', 'tap', 'scan', 'order', 'owner', 'done', 'solo', 'end'];
export const XFADE = 0.8;

// Supers: large, tight tracking, ≥1.5 s on screen, fade + 8 px rise.
export type SuperDef = { text: string; sub?: string; tag?: string; from: number; to: number; pos?: 'left' | 'center' | 'right' | 'bottom'; tone?: 'light' | 'dark' };
export const SUPERS: SuperDef[] = [
  { text: 'Reviews. Menu. Orders. One stand.', from: 8.0, to: 11.6, pos: 'bottom', tone: 'dark' },
  { text: 'One tap.', from: 13.2, to: 15.4, pos: 'left' },
  { text: 'Your Google review. Instantly.', from: 17.6, to: 21.6, pos: 'left' },
  { text: "Scan. A menu that's alive.", from: 27.0, to: 31.6, pos: 'left' },
  { text: 'Order from the table.', tag: 'TABLE ORDERING · ADD-ON', from: 33.2, to: 38.6, pos: 'left' },
  { text: 'Straight to your staff.', tag: 'TABLE ORDERING · ADD-ON', from: 41.2, to: 46.4, pos: 'left' },
  { text: 'Meet the tapfour app.', from: 53.0, to: 57.4, pos: 'left' },
  { text: 'Know your busiest hours.', from: 58.2, to: 63.4, pos: 'left' },
  { text: 'We set it all up.', sub: 'Google Business Profile · Website · Menu', from: 64.8, to: 73.4, pos: 'left' },
];

// Beats inside shots (seconds, absolute). Screens and sound design both read these.
export const BEATS = {
  lockup: 4.0,
  nfcContact: 14.3,
  reviewStars: 19.2, // first star; one every STAR_GAP
  starGap: 0.32,
  qrLock: 24.3,
  menuOpen: 25.4,
  menuLive: 28.6,
  add: [34.9, 36.5, 38.1],
  placeOrder: 39.3,
  orderToast: 41.4,
  orderOpen: 43.0,
  accept: 44.9,
  guestReceived: 47.2,
  guestPreparing: 49.0,
  dashCount: 53.2,
  gbpAfter: 66.6,
  landings: [76.0, 76.7, 77.4, 78.1, 78.9],
  priceCard: 80.0,
};

export const sec = (s: number, fps: number) => Math.round(s * fps);
