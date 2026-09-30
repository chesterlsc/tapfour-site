// The 3D render used inside a screen: the camera viewfinder (shot 4), seen from the phone's own camera position.
import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import { useVideoConfig } from 'remotion';
import { Scene3D } from '../three/Scene';
import { Stand, STAND, standPoint, ART, drift, useT, tween } from '../three/kit';
import { DarkStudio, Post } from '../three/studios';

export const CamAt: React.FC<{ pos: THREE.Vector3; target: THREE.Vector3; fov: number; roll?: number }> = ({ pos, target, fov, roll = 0 }) => {
  const ref = useRef<THREE.PerspectiveCamera>(null);
  const { width, height } = useVideoConfig();
  useLayoutEffect(() => {
    const c = ref.current!;
    c.aspect = width / height; // portrait compositions (the viewfinder) need this set explicitly
    c.position.copy(pos); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(target); c.fov = fov; c.updateProjectionMatrix();
  });
  return <PerspectiveCamera ref={ref} makeDefault manual aspect={width / height} fov={fov} near={0.5} far={4000} position={pos.toArray()} />;
};

const Y = new THREE.Vector3(0, 1, 0);
export const VF_STAND_RY = 0.16;
export const qrWorld = () => standPoint(ART.qr[0], ART.qr[1]).applyAxisAngle(Y, VF_STAND_RY);

// The phone camera's view of the white Review + Menu stand: handheld drift, focus pull, lock.
export const Viewfinder: React.FC = () => {
  const t = useT();
  const qr = qrWorld();
  const n = new THREE.Vector3(0, Math.sin(STAND.TILT), Math.cos(STAND.TILT)).applyAxisAngle(Y, VF_STAND_RY);
  const lock = tween(t, 2.1, 2.7);
  const dist = 25 - tween(t, 0, 2.5) * 8.5;
  const d = drift(t, 0.55 * (1 - 0.85 * lock), 3.1);
  const pos = qr.clone().addScaledVector(n, dist).add(new THREE.Vector3(0.6 + d[0], 3.2 + d[1], d[2]));
  const target = qr.clone().add(new THREE.Vector3(d[0] * 0.35, d[1] * 0.35, 0));
  const focus = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 12, -26), qr, tween(t, 0.7, 1.6));
  return (
    <Scene3D>
      <CamAt pos={pos} target={target} fov={58} roll={d[0] * 0.012} />
      <DarkStudio>
        <Stand finish="white" design="menu" rotation-y={VF_STAND_RY} />
      </DarkStudio>
      <Post focus={focus} range={4} bokeh={4} vignette={0.25} />
    </Scene3D>
  );
};
