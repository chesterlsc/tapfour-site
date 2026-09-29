// Device chrome for the screen compositions: generic, unbranded status bar, browser bar, touches.
// Screens are laid out in CSS px of the capture viewport (phone 393×852, tablet 1180×820) and scaled to the texture size.
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS, MONO, clamp, ease, easeIO } from '../brand';

export const PH = { w: 393, h: 852, status: 47, bar: 52 };
export const TB = { w: 1180, h: 820 };
export const cap = (f: string) => staticFile(`capture/${f}`);
export const useSec = () => { const f = useCurrentFrame(), { fps } = useVideoConfig(); return f / fps; };
export const tw = (t: number, a: number, b: number, from = 0, to = 1, e = easeIO) => interpolate(t, [a, b], [from, to], { ...clamp, easing: e });

// Scales CSS-px content up to the composition size.
export const Device: React.FC<{ w: number; h: number; bg?: string; children: React.ReactNode }> = ({ w, h, bg = C.bg, children }) => {
  const { width } = useVideoConfig();
  const s = width / w;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${s})`, transformOrigin: '0 0', overflow: 'hidden', fontFamily: SANS, WebkitFontSmoothing: 'antialiased' }}>{children}</div>
    </AbsoluteFill>
  );
};

const Bars: React.FC<{ c: string }> = ({ c }) => (
  <svg width="18" height="12" viewBox="0 0 18 12">{[0, 1, 2, 3].map(i => <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="1" fill={c} />)}</svg>
);
const Wifi: React.FC<{ c: string }> = ({ c }) => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 7a5.8 5.8 0 0 1 8 0" /><circle cx="8" cy="10" r="1.3" fill={c} stroke="none" /></svg>
);
const Battery: React.FC<{ c: string }> = ({ c }) => (
  <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".6" y=".6" width="22" height="10.8" rx="3.2" fill="none" stroke={c} strokeOpacity=".45" /><rect x="2.3" y="2.3" width="15" height="7.4" rx="1.8" fill={c} /><rect x="23.6" y="4" width="1.8" height="4" rx=".9" fill={c} fillOpacity=".45" /></svg>
);
export const StatusBar: React.FC<{ light?: boolean; time?: string }> = ({ light, time = '7:41' }) => {
  const c = light ? '#111' : '#fff';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: PH.status, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 30px 0 38px', color: c, font: `600 16px ${SANS}`, zIndex: 50 }}>
      <span style={{ letterSpacing: '-0.01em' }}>{time}</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Bars c={c} /><Wifi c={c} /><Battery c={c} /></span>
    </div>
  );
};

const Lock: React.FC<{ c: string }> = ({ c }) => (
  <svg width="11" height="13" viewBox="0 0 11 13"><rect x=".5" y="5.5" width="10" height="7" rx="1.8" fill={c} /><path d="M2.8 5.5V3.9a2.7 2.7 0 0 1 5.4 0v1.6" stroke={c} strokeWidth="1.4" fill="none" /></svg>
);
// Generic browser address bar under the status bar; `progress` 0..1 draws the loading line.
export const BrowserBar: React.FC<{ url: string; light?: boolean; progress?: number; progressOpacity?: number }> = ({ url, light, progress = 0, progressOpacity = 1 }) => {
  const bg = light ? '#ffffff' : C.bg, pill = light ? '#eef0f3' : '#1f1f22', fg = light ? '#202124' : C.fg;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: PH.status + PH.bar, background: bg, zIndex: 40 }}>
      <div style={{ position: 'absolute', left: 12, right: 12, top: PH.status + 4, height: 40, borderRadius: 14, background: pill, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', color: fg, font: `500 15px ${SANS}`, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <Lock c={light ? '#5f6368' : C.m3} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>{[0, 1, 2].map(i => <i key={i} style={{ width: 4, height: 4, borderRadius: 2, background: light ? '#5f6368' : C.m3, display: 'block' }} />)}</span>
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 2.5, width: `${progress * 100}%`, background: light ? '#1a73e8' : C.fg, opacity: progress > 0 ? progressOpacity : 0 }} />
    </div>
  );
};

// A fingertip touch: soft disc that presses in and fades.
export const Touch: React.FC<{ x: number; y: number; at: number; t: number; size?: number; light?: boolean }> = ({ x, y, at, t, size = 46, light }) => {
  const a = tw(t, at - 0.18, at - 0.02, 0, 1, ease) * tw(t, at + 0.12, at + 0.45, 1, 0);
  if (a <= 0) return null;
  const press = t < at ? tw(t, at - 0.18, at, 1.25, 0.9, ease) : tw(t, at, at + 0.3, 0.9, 1.2, ease);
  return <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', background: light ? 'rgba(20,20,20,.22)' : 'rgba(255,255,255,.34)', boxShadow: light ? 'none' : '0 0 0 1px rgba(255,255,255,.35)', opacity: a, transform: `scale(${press})`, zIndex: 90 }} />;
};

// A full-page capture scrolled inside a viewport (top..bottom of the device, in CSS px).
export const Page: React.FC<{ src: string; top: number; scroll: number; opacity?: number; clip?: [number, number]; style?: React.CSSProperties; width?: number }> = ({ src, top, scroll, opacity = 1, clip, style, width = PH.w }) => (
  <div style={{ position: 'absolute', left: 0, top, width, bottom: 0, overflow: 'hidden', opacity, ...(clip ? { clipPath: `inset(${clip[0] - scroll}px 0 calc(100% - ${clip[1] - scroll}px) 0)` } : {}), ...style }}>
    <Img src={src} style={{ position: 'absolute', left: 0, top: -scroll, width }} />
  </div>
);

export const Mono: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <span style={{ font: `500 11px ${MONO}`, letterSpacing: '0.06em', ...style }}>{children}</span>;
