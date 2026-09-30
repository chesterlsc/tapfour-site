// A 3D shot: full-frame ThreeCanvas at output resolution, with 2D overlays (supers) in 1920×1080 design units.
import React, { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { DESIGN } from '../timeline';

export const Scene3D: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode; exposure?: number }> = ({ children, overlay, exposure = 1 }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <ThreeCanvas width={width} height={height} shadows dpr={1}
        gl={{ antialias: false, toneMapping: THREE.NoToneMapping, toneMappingExposure: exposure, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}>
        {children}
        <Kick />
      </ThreeCanvas>
      {overlay && <Overlay>{overlay}</Overlay>}
    </AbsoluteFill>
  );
};

// Re-draw once everything inside the canvas has mounted (suspended textures, env maps), then let Remotion capture.
const Kick: React.FC = () => {
  const { advance } = useThree();
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const h = delayRender('three: draw after mount');
    let n = 0;
    // timers, not requestAnimationFrame: background tabs (render concurrency) throttle rAF
    const tick = () => { advance(performance.now()); if (++n < 1) setTimeout(tick, 0); else continueRender(h); };
    const id = setTimeout(tick, 0);
    return () => { clearTimeout(id); continueRender(h); };
  }, [frame]);
  return null;
};

// Everything 2D is laid out at 1920×1080 and scaled to the output size (4K = one flag).
export const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useVideoConfig();
  const s = width / DESIGN.width;
  return <div style={{ position: 'absolute', left: 0, top: 0, width: DESIGN.width, height: DESIGN.height, transform: `scale(${s})`, transformOrigin: '0 0' }}>{children}</div>;
};
