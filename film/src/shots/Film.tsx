// The edit: nine shots in the fixed story order, with the timings from timeline.ts.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, getStaticFiles } from 'remotion';
import { SHOTS, ShotId } from '../timeline';
import { easeIO, clamp } from '../brand';
import { ShotOpen, ShotEnd } from './Flat';
import { ShotReveal, ShotTap, ShotScan, ShotOrder, ShotOwner, ShotSetup, ShotSolo } from './Shots3D';

export const SHOT_COMPONENTS: Record<ShotId, React.FC> = {
  open: ShotOpen, reveal: ShotReveal, tap: ShotTap, scan: ShotScan, order: ShotOrder, owner: ShotOwner, setup: ShotSetup, solo: ShotSolo, end: ShotEnd
};

// How each shot enters: a hard cut on the beat (0), or a dissolve of n seconds over the tail of the previous shot.
export const ENTER: Record<ShotId, number> = { open: 0, reveal: 0, tap: 0, scan: 0, order: 0.6, owner: 0, setup: 0, solo: 0.7, end: 0.8 };

const FadeIn: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const o = dur ? interpolate(f / fps, [0, dur], [0, 1], { ...clamp, easing: easeIO }) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

export const Film: React.FC = () => {
  const { fps } = useVideoConfig();
  const hasAudio = getStaticFiles().some(f => f.name === 'audio/tapfour-connect.wav');
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {SHOTS.map((s, i) => {
        const next = SHOTS[i + 1];
        const tail = next ? ENTER[next.id] : 0; // keeps rendering under the next shot's dissolve
        const C = SHOT_COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={Math.round(s.start * fps)} durationInFrames={Math.round((s.end - s.start + tail) * fps)} name={s.label}>
            <FadeIn dur={ENTER[s.id]}><C /></FadeIn>
          </Sequence>
        );
      })}
      {hasAudio && <Audio src={staticFile('audio/tapfour-connect.wav')} />}
    </AbsoluteFill>
  );
};
