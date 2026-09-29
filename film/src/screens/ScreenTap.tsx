// Shot 3 phone screen: lock screen → NFC banner → browser opens the real tap URL (302 from the local Worker:
// go.tap4.ph/t/K4NT07 → g.page/r/kanto-coffee-example/review) → Google's "write a review" sheet, stars fill to 5.
// The Google sheet is recreated for the film (not in the repo), fictional guest name.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, SANS, MONO, Leaf, ease } from '../brand';
import { BEATS } from '../timeline';
import { Device, StatusBar, BrowserBar, PH, Touch, useSec, tw } from './ui';

const B = BEATS.tap;
const ROBOTO = "'Roboto', system-ui, sans-serif";

export const NfcGlyph: React.FC<{ c: string; size: number }> = ({ c, size }) => (
  <svg viewBox="0 0 60 80" width={size * 0.75} height={size} fill="none" stroke={c} strokeWidth="6" strokeLinecap="round"><circle cx="8" cy="40" r="4.6" fill={c} stroke="none" /><path d="M18 28a17 17 0 0 1 0 24" /><path d="M28 19a29 29 0 0 1 0 42" /><path d="M38 10a41 41 0 0 1 0 60" /></svg>
);

export const LockScreen: React.FC<{ dim?: number }> = ({ dim = 0 }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(120% 70% at 30% 100%, #2c3a14 0%, #10150b 45%, #070806 100%)' }}>
    <div style={{ position: 'absolute', top: 96, left: 0, right: 0, textAlign: 'center', color: '#f4f4f0' }}>
      <div style={{ font: `500 18px ${SANS}`, opacity: 0.85 }}>Tuesday, September 29</div>
      <div style={{ font: `600 96px ${SANS}`, letterSpacing: '-0.04em', lineHeight: 1.05 }}>7:41</div>
    </div>
    <div style={{ position: 'absolute', bottom: 46, left: 44, right: 44, display: 'flex', justifyContent: 'space-between' }}>
      {[0, 1].map(i => <div key={i} style={{ width: 50, height: 50, borderRadius: 25, background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(10px)' }} />)}
    </div>
    <div style={{ position: 'absolute', bottom: 10, left: '50%', width: 134, height: 5, marginLeft: -67, borderRadius: 3, background: 'rgba(255,255,255,.8)' }} />
    <AbsoluteFill style={{ background: '#000', opacity: dim }} />
  </AbsoluteFill>
);

const Star: React.FC<{ on: number; size: number }> = ({ on, size }) => {
  const d = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ transform: `scale(${1 + Math.sin(Math.min(1, on) * Math.PI) * 0.18})` }}>
      <path d={d} fill="none" stroke="#5f6368" strokeWidth="1.3" strokeLinejoin="round" />
      <path d={d} fill="#fbbc04" stroke="#fbbc04" strokeWidth="1.3" strokeLinejoin="round" style={{ opacity: Math.min(1, on * 3) }} />
    </svg>
  );
};

export const GoogleReviewSheet: React.FC<{ t: number; stars: number[] }> = ({ t, stars }) => {
  const filled = stars.filter(s => t >= s).length;
  return (
    <AbsoluteFill style={{ background: '#fff', fontFamily: ROBOTO, color: '#202124' }}>
      <div style={{ position: 'absolute', top: PH.status + PH.bar, left: 0, right: 0, height: 60, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid #e8eaed' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ margin: 8 }}><path d="M6 6l12 12M18 6L6 18" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" /></svg>
        <div style={{ flex: 1, textAlign: 'center', marginRight: 40, font: `500 19px ${ROBOTO}` }}>Kanto Coffee</div>
      </div>
      <div style={{ position: 'absolute', top: PH.status + PH.bar + 84, left: 24, right: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: '#0b8043', color: '#fff', display: 'grid', placeItems: 'center', font: `500 19px ${ROBOTO}` }}>J</div>
          <div><div style={{ font: `500 16px ${ROBOTO}` }}>Jess Ramos</div>
            <div style={{ font: `400 13px ${ROBOTO}`, color: '#5f6368', display: 'flex', alignItems: 'center', gap: 5 }}>Posting publicly across Google <span style={{ width: 14, height: 14, borderRadius: 7, border: '1.4px solid #5f6368', display: 'inline-grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>i</span></div></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '38px 0 10px' }}>
          {stars.map((s, i) => <Star key={i} size={48} on={tw(t, s, s + 0.22, 0, 1, ease)} />)}
        </div>
        <div style={{ textAlign: 'center', font: `400 14px ${ROBOTO}`, color: '#5f6368', height: 20, opacity: filled === 5 ? tw(t, stars[4] + 0.2, stars[4] + 0.5) : 0 }}>Amazing</div>
        <div style={{ marginTop: 22, height: 150, borderRadius: 8, border: '1px solid #dadce0', padding: 16, font: `400 16px ${ROBOTO}`, color: '#70757a', lineHeight: 1.4 }}>Share details of your own experience at this place</div>
        <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 20, border: '1px solid #dadce0', color: '#1a73e8', font: `500 14px ${ROBOTO}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#1a73e8" d="M9 3L7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 14a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" /></svg>Add photos and videos</div>
      </div>
      <div style={{ position: 'absolute', bottom: 34, right: 24, padding: '11px 28px', borderRadius: 20, background: filled ? '#1a73e8' : '#e8eaed', color: filled ? '#fff' : '#9aa0a6', font: `500 15px ${ROBOTO}` }}>Post</div>
    </AbsoluteFill>
  );
};

export const ScreenTap: React.FC = () => {
  const t = useSec();
  const bannerIn = tw(t, B.banner, B.banner + 0.45, 0, 1, ease), bannerOut = tw(t, B.browser - 0.05, B.browser + 0.25);
  const browser = tw(t, B.browser, B.browser + 0.4, 0, 1, ease);
  const redirected = t >= B.redirect;
  const progress = t < B.redirect ? tw(t, B.browser + 0.15, B.redirect, 0, 0.62) : tw(t, B.redirect, B.sheet, 0.62, 1);
  const sheet = tw(t, B.sheet, B.sheet + 0.5, 0, 1, ease);
  const stars = [0, 1, 2, 3, 4].map(i => B.stars + i * B.starStep);
  const url = t < B.redirect ? 'go.tap4.ph/t/K4NT07' : t < B.sheet + 0.4 ? 'g.page/r/kanto-coffee-example/review' : 'google.com';
  return (
    <Device w={PH.w} h={PH.h} bg="#000">
      <LockScreen dim={browser * 0.6} />
      {/* NFC banner */}
      <div style={{ position: 'absolute', left: 8, right: 8, top: 8 + (1 - bannerIn) * -90, height: 74, borderRadius: 24, background: 'rgba(38,39,36,.94)', boxShadow: '0 10px 30px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', opacity: bannerIn * (1 - bannerOut), transform: `scale(${1 - bannerOut * 0.05})`, zIndex: 60 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: C.lime, display: 'grid', placeItems: 'center' }}><NfcGlyph c={C.bg} size={22} /></div>
        <div style={{ flex: 1, color: '#f4f4f0' }}>
          <div style={{ font: `600 15px ${SANS}` }}>NFC tag</div>
          <div style={{ font: `400 14px ${SANS}`, color: '#c9c9c4' }}>Open go.tap4.ph</div>
        </div>
        <div style={{ font: `400 13px ${SANS}`, color: '#9b9b96', alignSelf: 'flex-start', marginTop: 16 }}>now</div>
      </div>
      {/* browser */}
      {browser > 0 && (
        <AbsoluteFill style={{ opacity: browser, transform: `scale(${0.94 + browser * 0.06})`, transformOrigin: '50% 10%', borderRadius: 40 * (1 - browser), overflow: 'hidden', background: '#fff' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#fff' }} />
          {sheet > 0 && <AbsoluteFill style={{ transform: `translateY(${(1 - sheet) * 60}px)`, opacity: sheet }}><GoogleReviewSheet t={t} stars={stars} /></AbsoluteFill>}
          <BrowserBar light url={url} progress={progress} progressOpacity={1 - tw(t, B.sheet, B.sheet + 0.3)} />
          <StatusBar light />
        </AbsoluteFill>
      )}
      {browser <= 0 && <StatusBar />}
      <Touch x={196} y={45} at={B.browser - 0.1} t={t} />
      <div style={{ position: 'absolute', bottom: 8, left: '50%', width: 134, height: 5, marginLeft: -67, borderRadius: 3, background: browser > 0.5 ? '#111' : 'transparent', opacity: 0.8, zIndex: 95 }} />
    </Device>
  );
};
