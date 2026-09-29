// Look development: the stand and phone in each studio, for matching against the product renders.
import React from 'react';
import * as THREE from 'three';
import { Scene3D } from '../three/Scene';
import { Stand, Phone, Cam, useT, useArt } from '../three/kit';
import { DarkStudio, LimeStudio, WarmStudio, Cafe, Post, Cup } from '../three/studios';

export const LookDev: React.FC<{ studio: 'dark' | 'lime' | 'warm' | 'cafe' }> = ({ studio }) => {
  const t = useT();
  const Body = () => { const screen = useArt('review-black.png'); return (
    <>
      <Stand finish={studio === 'warm' ? 'white' : 'black'} design={studio === 'dark' ? 'review' : 'menu'} rotation-y={0.45} />
      {studio === 'lime' && <Stand finish="white" design="menu" position={[13, 0, -2]} rotation-y={0.3} />}
      <Phone position={[-12, 7.6, 4]} rotation={[-0.1, 0.5, 0]} tex={screen} />
      {studio === 'cafe' && <Cup position={[12, 0, 6]} />}
    </>
  ); };
  const Studio = { dark: DarkStudio, lime: LimeStudio, warm: WarmStudio, cafe: Cafe }[studio];
  return (
    <Scene3D>
      <Cam t={t} keys={[{ t: 0, pos: [18, 14, 48], target: [0, 8, 0], fov: 30 }]} />
      <Studio><Body /></Studio>
      <Post focus={new THREE.Vector3(0, 8, 0)} range={25} bokeh={2} />
    </Scene3D>
  );
};
