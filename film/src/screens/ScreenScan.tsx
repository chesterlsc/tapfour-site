// Shot 4 phone screen: camera viewfinder on the white Review + Menu stand (the supplied product render, framed on
// its QR with a handheld drift and a focus pull), brackets lock on the QR, link pill, tap → the REAL live menu (/menu/kanto-coffee), then the
// REAL owner edits land: Ube Cheese Pandesal → Sold out, Calamansi Cold Brew ₱190 → ₱175 (captured after the
// edits were made in /app/menu).
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, SANS, MONO, ease, easeIO } from '../brand';
import { BEATS } from '../timeline';
import { Device, StatusBar, BrowserBar, PH, Touch, Page, cap, useSec, tw } from './ui';
import meta from '../../public/capture/meta.json';

const B = BEATS.scan;
// The render (2160×3840) with its QR (1440, 1642) centred in the viewfinder at 0.6 css px per render px.
const VF = { w: 2160, h: 3840, qx: 1440, qy: 1642, s: 0.6 };

const row = (name: string) => meta.menuBefore.items.find(i => i.text === name)!;

const Bracket: React.FC<{ x: number; y: number; s: number; rot: number; c: string }> = ({ x, y, s, rot, c }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderLeft: `4px solid ${c}`, borderTop: `4px solid ${c}`, borderTopLeftRadius: 12, transform: `rotate(${rot}deg)`, transformOrigin: '0 0' }} />
);

export const ScreenScan: React.FC = () => {
  const t = useSec();
  const lock = tw(t, B.lock - 0.25, B.lock + 0.25, 0, 1, ease);
  const pill = tw(t, B.pill, B.pill + 0.35, 0, 1, ease);
  const up = tw(t, B.menuUp, B.menuUp + 0.6, 0, 1, ease);
  const scroll = tw(t, B.menuUp + 0.9, B.menuUp + 1.8, 0, 110);
  // brackets: loose & breathing while searching → snap to the QR (centred, ~150 px)
  // the QR reads taller than wide in the render (the face leans back), so the brackets settle on a portrait box
  const hx = 128 - lock * 42 + Math.sin(t * 5) * 3 * (1 - lock), hy = 128 - lock * 24 + Math.sin(t * 5) * 3 * (1 - lock);
  const cx = 196.5, cy = 426;
  const settle = tw(t, 0.4, B.lock, 0, 1, easeIO);
  const bc = lock > 0.5 ? '#ffffff' : 'rgba(255,255,255,.75)';
  const top = PH.status + PH.bar;
  const pandesal = row('Ube Cheese Pandesal'), calamansi = row('Calamansi Cold Brew');
  const pandesalAfter = meta.menuAfter.items.find(i => i.text === 'Ube Cheese Pandesal')!, grow = pandesalAfter.h - pandesal.h;
  const sold = tw(t, B.soldOut, B.soldOut + 0.35), price = tw(t, B.price, B.price + 0.35);
  const flash = (at: number) => tw(t, at, at + 0.15) * tw(t, at + 0.5, at + 1.4, 1, 0);
  return (
    <Device w={PH.w} h={PH.h} bg="#000">
      <AbsoluteFill>
        {/* handheld: searching drift that settles as the brackets lock; focus pulls in from soft */}
        <Img src={staticFile('art/vf-white-menu.jpg')} style={{ position: 'absolute', width: VF.w * VF.s, height: VF.h * VF.s,
          left: cx - VF.qx * VF.s + (1 - settle) * (Math.sin(t * 1.7) * 22 + 34) + Math.sin(t * 2.9) * 1.6,
          top: cy - VF.qy * VF.s + (1 - settle) * (Math.cos(t * 1.3) * 16 - 40) + Math.cos(t * 3.4) * 1.4,
          transform: `scale(${1.1 - 0.1 * settle}) rotate(${(1 - settle) * -2.5}deg)`, transformOrigin: `${VF.qx * VF.s}px ${VF.qy * VF.s}px`,
          filter: `blur(${tw(t, 0.5, 1.6, 7, 0)}px)` }} />
        {/* camera UI (generic) */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 96, background: 'linear-gradient(rgba(0,0,0,.55), transparent)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 190, background: 'rgba(0,0,0,.62)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 16, font: `600 12px ${SANS}`, letterSpacing: '0.08em', color: 'rgba(255,255,255,.7)' }}>
            <span>VIDEO</span><span style={{ color: '#ffffff' }}>PHOTO</span><span>PORTRAIT</span>
          </div>
          <div style={{ position: 'absolute', left: '50%', top: 60, width: 74, height: 74, marginLeft: -37, borderRadius: 37, border: '4px solid #fff', display: 'grid', placeItems: 'center' }}><div style={{ width: 60, height: 60, borderRadius: 30, background: '#fff' }} /></div>
          <div style={{ position: 'absolute', left: 44, top: 74, width: 46, height: 46, borderRadius: 10, background: '#3a3a36' }} />
          <div style={{ position: 'absolute', right: 44, top: 74, width: 46, height: 46, borderRadius: 23, background: 'rgba(255,255,255,.18)' }} />
        </div>
        {/* brackets */}
        <div style={{ opacity: tw(t, 0.9, 1.4) * (1 - tw(t, B.tapPill, B.tapPill + 0.2)) }}>
          <Bracket x={cx - hx} y={cy - hy} s={34} rot={0} c={bc} />
          <Bracket x={cx + hx} y={cy - hy} s={34} rot={90} c={bc} />
          <Bracket x={cx + hx} y={cy + hy} s={34} rot={180} c={bc} />
          <Bracket x={cx - hx} y={cy + hy} s={34} rot={270} c={bc} />
        </div>
        {/* link pill */}
        <div style={{ position: 'absolute', left: '50%', top: cy + 128, transform: `translate(-50%, ${(1 - pill) * 10}px) scale(${0.9 + pill * 0.1 - (t > B.tapPill - 0.1 && t < B.tapPill + 0.2 ? 0.04 : 0)})`, opacity: pill, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 99, background: '#f4f4f0', color: '#111', font: `600 14px ${SANS}`, whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(0,0,0,.35)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.6" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
          go.tap4.ph/q/K4NT01/menu
        </div>
        <StatusBar />
      </AbsoluteFill>
      {/* browser sheet with the real menu */}
      {up > 0 && (
        <AbsoluteFill style={{ transform: `translateY(${(1 - up) * PH.h}px)`, background: C.bg, borderRadius: `${24 * (1 - up)}px ${24 * (1 - up)}px 0 0`, boxShadow: '0 -20px 60px rgba(0,0,0,.5)' }}>
          {/* the sold-out row grows (SOLD OUT label), so the rows below slide down as it changes */}
          <Page src={cap('menu-before.png')} top={top} scroll={scroll} clip={[0, pandesal.y]} />
          <Page src={cap('menu-before.png')} top={top} scroll={scroll} clip={[pandesal.y + pandesal.h, 5000]} style={{ transform: `translateY(${grow * sold}px)` }} />
          <Page src={cap('menu-before.png')} top={top} scroll={scroll} opacity={1 - sold} clip={[pandesal.y, pandesal.y + pandesal.h]} />
          <Page src={cap('menu-after.png')} top={top} scroll={scroll} opacity={sold} clip={[pandesalAfter.y, pandesalAfter.y + pandesalAfter.h]} />
          <Page src={cap('menu-after.png')} top={top} scroll={scroll} opacity={price} clip={[calamansi.y, calamansi.y + calamansi.h]} />
          {/* a soft lime pulse on the row that just changed */}
          {[[pandesalAfter, B.soldOut], [calamansi, B.price]].map(([r, at]: any, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: top + r.y - scroll, height: r.h, background: 'rgba(200,242,60,.14)', boxShadow: 'inset 3px 0 0 #c8f23c', opacity: flash(at) }} />
          ))}
          {/* .mn__tabs is position: sticky on the real page */}
          {scroll > meta.menuBefore.tabs.y && <Img src={cap('order-tabs-0.png')} style={{ position: 'absolute', left: 0, top, width: PH.w, zIndex: 5 }} />}
          <BrowserBar url="go.tap4.ph/menu/kanto-coffee" progress={tw(t, B.menuUp, B.menuUp + 0.5)} progressOpacity={1 - tw(t, B.menuUp + 0.5, B.menuUp + 0.8)} />
          <StatusBar />
        </AbsoluteFill>
      )}
      <Touch x={196} y={cy + 148} at={B.tapPill} t={t} />
    </Device>
  );
};
