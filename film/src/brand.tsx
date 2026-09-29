// Brand primitives from the repo: tokens (platform/src/base.css :root), fonts (assets/*.woff2),
// the two-leaf mark (assets/favicon.svg paths) and the "tapfour" lockup (.brand in sections/header.liquid).
import React from 'react';
import { continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

export const C = {
  bg: '#0a0a0b', fg: '#f2f0eb', lime: '#c8f23c',
  m1: '#d6d4ce', m2: '#b5b3ad', m3: '#8a8883', m4: '#6f6c66', m5: '#5d5c59',
  card: '#121214', l1: '#1f1f22', l2: '#232326', l4: '#2a2a2d', pink: '#f27fa8'
};
export const SANS = "'Instrument Sans', system-ui, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";

let fontsPromise: Promise<unknown> | null = null;
export const loadFonts = () => {
  if (fontsPromise) return fontsPromise;
  const faces = [
    new FontFace('Instrument Sans', `url(${staticFile('fonts/instrument-sans-latin.woff2')}) format('woff2')`, { weight: '400 700' }),
    new FontFace('JetBrains Mono', `url(${staticFile('fonts/jetbrains-mono-latin.woff2')}) format('woff2')`, { weight: '400 700' }),
    new FontFace('Roboto', `url(${staticFile('fonts/roboto-400.woff2')}) format('woff2')`, { weight: '400' }),
    new FontFace('Roboto', `url(${staticFile('fonts/roboto-500.woff2')}) format('woff2')`, { weight: '500' }),
    new FontFace('Roboto', `url(${staticFile('fonts/roboto-700.woff2')}) format('woff2')`, { weight: '700' })
  ];
  fontsPromise = Promise.all(faces.map(f => f.load().then(l => document.fonts.add(l))));
  return fontsPromise;
};
export const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => { loadFonts().then(() => continueRender(h)); }, [h]);
};

// Leaf mark paths from assets/favicon.svg (the tile removed).
export const Leaf: React.FC<{ size: number; color?: string; style?: React.CSSProperties }> = ({ size, color = C.lime, style }) => (
  <svg viewBox="0 0 23 22" width={size * 23 / 22} height={size} style={{ display: 'block', flexShrink: 0, ...style }}>
    <g fill={color} transform="translate(0 -2)">
      <path d="M0 6H2.2A8.8 12.8 0 0 1 11 18.8V22H8.8A8.8 12.8 0 0 1 0 9.2Z" />
      <path d="M12 14.8A8.8 12.8 0 0 1 20.8 2H23V5.2A8.8 12.8 0 0 1 14.2 18H12Z" />
    </g>
  </svg>
);

// The lockup: mark height = font size, gap .38em, "tapfour" in Instrument Sans 700 at −.045em. Never split.
export const Lockup: React.FC<{ size: number; color?: string; leaf?: string; style?: React.CSSProperties }> = ({ size, color = C.fg, leaf = C.lime, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.38, fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: '-0.045em', color, lineHeight: 1, ...style }}>
    <Leaf size={size * 0.92} color={leaf} style={{ transform: `translateY(${size * 0.02}px)` }} />
    <span style={{ transform: `translateY(${-size * 0.04}px)` }}>tapfour</span>
  </div>
);

export const ease = Easing.bezier(0.22, 1, 0.36, 1); // long, soft ease-out
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1); // symmetric ease-in-out for camera moves
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Fade + 8 px rise in, fade out; t in seconds.
export const useInOut = (at: number, out: number, dur = 0.7) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const a = interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: ease });
  const b = interpolate(t, [out - 0.5, out], [1, 0], { ...clamp, easing: easeIO });
  return { opacity: Math.min(a, b), y: (1 - a) * 8 };
};

export const SuperText: React.FC<{ text: string; sub?: string; tag?: string; at: number; out: number; pos?: 'left' | 'center' | 'right' | 'bottom'; dark?: boolean }> = ({ text, sub, tag, at, out, pos = 'left', dark }) => {
  const { opacity, y } = useInOut(at, out);
  const s2 = useInOut(at + 0.35, out);
  const color = dark ? C.bg : C.fg;
  const align = pos === 'center' ? 'center' : pos === 'right' ? 'right' : 'left';
  const box: React.CSSProperties = pos === 'center' ? { left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }
    : pos === 'bottom' ? { left: 120, right: 120, bottom: 96, alignItems: 'center' }
    : pos === 'right' ? { right: 120, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-end' }
    : { left: 120, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start' };
  if (opacity <= 0) return null;
  return (
    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: 22, textAlign: align, ...box }}>
      {tag && <div style={{ opacity: s2.opacity, transform: `translateY(${s2.y}px)`, font: `500 19px ${MONO}`, letterSpacing: '0.1em', color: dark ? C.bg : C.lime }}>{tag}</div>}
      <div style={{ opacity, transform: `translateY(${y}px)`, fontFamily: SANS, fontWeight: 700, fontSize: pos === 'bottom' ? 84 : 100, lineHeight: 0.94, letterSpacing: '-0.055em', color, whiteSpace: 'pre-line', textShadow: dark ? 'none' : '0 2px 40px rgba(0,0,0,.35)' }}>{text}</div>
      {sub && <div style={{ opacity: s2.opacity, transform: `translateY(${s2.y}px)`, font: `500 22px ${MONO}`, letterSpacing: '0.08em', color: dark ? C.bg : C.m1, textTransform: 'uppercase' }}>{sub}</div>}
    </div>
  );
};
