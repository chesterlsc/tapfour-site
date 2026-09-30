import React from 'react';
import { Composition } from 'remotion';
import { DESIGN, DEFAULT_FPS, FILM_SECONDS, SHOTS, shot } from './timeline';
import { useFonts } from './brand';
import { LookDev } from './shots/LookDev';
import { Viewfinder } from './shots/Stills';
import { ScreenTap } from './screens/ScreenTap';
import { ScreenScan } from './screens/ScreenScan';
import { ScreenOrderGuest, ScreenOrderTablet, ScreenDash, ScreenSetupPhone, ScreenSetupTablet } from './screens/Screens';
import { PH, TB } from './screens/ui';
import { SHOT_COMPONENTS, Film } from './shots/Film';

// Input props: { scale: 1 = 1080p, 2 = 4K; fps } — `node render.mjs --scale 2 --fps 30`.
export type P = { scale?: number; fps?: number };
const Fonts: React.FC<{ children: React.ReactNode }> = ({ children }) => { useFonts(); return <>{children}</>; };
const withFonts = <T extends object>(C: React.FC<T>) => (p: T) => <Fonts><C {...p} /></Fonts>;
const meta = (w: number, h: number, seconds: number) => ({ props }: { props: Record<string, unknown> }) => {
  const { scale = 1, fps = DEFAULT_FPS } = props as P;
  return { width: Math.round(w * scale / 2) * 2, height: Math.round(h * scale / 2) * 2, fps, durationInFrames: Math.round(seconds * fps) };
};
const base = { fps: DEFAULT_FPS, width: DESIGN.width, height: DESIGN.height, durationInFrames: 1, defaultProps: { scale: 1, fps: DEFAULT_FPS } };

// Device screens render at 2× CSS px per output scale (phone 786×1704, tablet 1770×1230 at 1080p).
const screens: [string, React.FC, number, number, number][] = [
  ['ScreenTap', ScreenTap, PH.w * 2, PH.h * 2, shot('tap').end - shot('tap').start],
  ['ScreenScan', ScreenScan, PH.w * 2, PH.h * 2, shot('scan').end - shot('scan').start],
  ['ScreenOrderGuest', ScreenOrderGuest, PH.w * 2, PH.h * 2, shot('order').end - shot('order').start],
  ['ScreenOrderTablet', ScreenOrderTablet, TB.w * 1.5, TB.h * 1.5, shot('order').end - shot('order').start],
  ['ScreenDash', ScreenDash, TB.w * 1.5, TB.h * 1.5, shot('owner').end - shot('owner').start],
  ['ScreenSetupPhone', ScreenSetupPhone, PH.w * 2, PH.h * 2, shot('setup').end - shot('setup').start],
  ['ScreenSetupTablet', ScreenSetupTablet, TB.w * 1.5, TB.h * 1.5, shot('setup').end - shot('setup').start]
];

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={withFonts(Film)} {...base} calculateMetadata={meta(DESIGN.width, DESIGN.height, FILM_SECONDS)} />
    {SHOTS.map(s => (
      <Composition key={s.id} id={`Shot-${s.id}`} component={withFonts(SHOT_COMPONENTS[s.id])} {...base} calculateMetadata={meta(DESIGN.width, DESIGN.height, s.end - s.start)} />
    ))}
    {screens.map(([id, C, w, h, sec]) => (
      <Composition key={id} id={id} component={withFonts(C)} {...base} calculateMetadata={meta(w, h, sec)} />
    ))}
    <Composition id="Viewfinder" component={withFonts(Viewfinder)} {...base} calculateMetadata={meta(PH.w * 2, PH.h * 2, 5)} />
    {(['black-review', 'black-menu', 'white-review', 'white-menu'] as const).map(s => (
      <Composition key={s} id={`LookDev-${s}`} component={withFonts(LookDev)} {...base} defaultProps={{ finish: s.split('-')[0] as 'black', design: s.split('-')[1] as 'review' }} calculateMetadata={meta(1080, 1920, 1)} />
    ))}
  </>
);
