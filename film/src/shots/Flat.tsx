// 2D shots: the opening (supplied 4K render, 2.5D push + light sweep) and the end card.
import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, Easing } from 'remotion';
import { C, SANS, MONO, Lockup, ease, clamp, useInOut } from '../brand';
import { Overlay } from '../three/Scene';
import { BEATS } from '../timeline';
import { useT } from '../three/kit';
import plate from '../../public/art/plate-open.json';

const slow = Easing.bezier(0.3, 0, 0.2, 1);

export const ShotOpen: React.FC = () => {
  const t = useT();
  const k = interpolate(t, [0, 7.6], [0, 1], { ...clamp, easing: slow });
  const scale = 1.0 + 0.17 * k;
  const ox = 2250 / plate.w, oy = 1020 / plate.h;
  const fade = interpolate(t, [0, 1.2], [0, 1], { ...clamp, easing: ease });
  const poly = plate.face.map(([x, y]) => `${(x / plate.w) * 100}% ${(y / plate.h) * 100}%`).join(',');
  const sweep = interpolate(t, [1.0, 3.6], [-40, 140], { ...clamp, easing: Easing.bezier(0.45, 0, 0.3, 1) });
  const L = useInOut(BEATS.open.lockup, 99, 0.9);
  const T = useInOut(BEATS.open.lockup + 0.35, 99, 0.9);
  return (
    <AbsoluteFill style={{ background: '#050605' }}>
      <Overlay>
        <div style={{ position: 'absolute', inset: 0, opacity: fade, transform: `scale(${scale}) translateY(${-k * 14}px)`, transformOrigin: `${ox * 100}% ${oy * 100}%` }}>
          <Img src={staticFile('art/plate-open.jpg')} style={{ width: 1920, height: 1080, display: 'block' }} />
          {/* a slow specular sweep across the glossy face */}
          <div style={{ position: 'absolute', inset: 0, clipPath: `polygon(${poly})`, mixBlendMode: 'screen' }}>
            <div style={{ position: 'absolute', top: '-20%', bottom: '-20%', width: '22%', left: `${sweep}%`, transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.10) 40%, rgba(255,255,255,.16) 50%, rgba(255,255,255,.10) 60%, transparent)', filter: 'blur(8px)' }} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 150, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
          <div style={{ opacity: L.opacity, transform: `translateY(${L.y}px)` }}><Lockup size={50} /></div>
          <div style={{ opacity: T.opacity, transform: `translateY(${T.y}px)`, fontFamily: SANS, fontWeight: 700, fontSize: 118, lineHeight: 0.92, letterSpacing: '-0.058em', color: C.fg }}>Tapfour<br />Connect</div>
        </div>
      </Overlay>
    </AbsoluteFill>
  );
};

export const TAGLINE = 'Every table, connected.';
export const ShotEnd: React.FC = () => {
  const a = useInOut(0.3, 99, 1.0), b = useInOut(0.9, 99, 1.0), c = useInOut(1.6, 99, 1.0);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Overlay>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 44 }}>
          <div style={{ opacity: a.opacity, transform: `translateY(${a.y}px)` }}><Lockup size={74} /></div>
          <div style={{ opacity: b.opacity, transform: `translateY(${b.y}px)`, fontFamily: SANS, fontWeight: 700, fontSize: 92, letterSpacing: '-0.055em', color: C.fg }}>{TAGLINE}</div>
          <div style={{ opacity: c.opacity, transform: `translateY(${c.y}px)`, font: `500 28px ${MONO}`, letterSpacing: '0.12em', color: C.lime }}>tap4.ph</div>
        </div>
      </Overlay>
    </AbsoluteFill>
  );
};
