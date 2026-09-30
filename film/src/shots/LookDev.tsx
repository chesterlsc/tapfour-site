// Look development: the 3D stand seen through the product renders' own camera (solved from the renders with PnP:
// 31° vertical field of view, portrait 2160×3840), so each frame can be laid over the supplied render and compared.
import React from 'react';
import * as THREE from 'three';
import { Scene3D } from '../three/Scene';
import { Stand, Finish, Design } from '../three/kit';
import { DarkStudio, Post } from '../three/studios';
import { CamAt } from './Stills';

export const RENDER_CAM = { pos: new THREE.Vector3(-38.29, 20.7, 43.11), target: new THREE.Vector3(-0.25, 5.42, -2.41), fov: 31.0 };
export const LookDev: React.FC<{ finish: Finish; design: Design }> = ({ finish, design }) => (
  <Scene3D>
    <CamAt pos={RENDER_CAM.pos} target={RENDER_CAM.target} fov={RENDER_CAM.fov} />
    <DarkStudio><Stand finish={finish} design={design} /></DarkStudio>
    <Post focus={new THREE.Vector3(0, 7, 0)} range={30} bokeh={0.5} vignette={0.3} />
  </Scene3D>
);
