// A set = renderer + environment + table + objects (each with a live mirror copy for the table reflection
// and a contact shadow), camera and optional depth of field.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeRenderer, makeEnvironment, makeCyc, makeTable, contactShadow, addKeyLights } from './world.js';
import { makeStand } from './stand.js';
import { makePhone, makeCup } from './props.js';

let qrCache;
export async function qrData() { return qrCache ||= await (await fetch('/web/data/qr.json')).json(); }

export const MOODS = {
  studio: { cyc: {}, table: {}, exposure: 1.0 },
  warm: {
    cyc: { floor: [15, 11, 9], wall: '#2a1c12', glow: 'rgba(120,72,34,0.55)', warm: true, spot: [0.5, 0.4] },
    table: { color: [15, 11, 9], poolColor: 'rgba(96,60,32,0.5)', warm: true, reflect: 0.3 },
    exposure: 1.05
  }
};

export async function makeSet({ W, H, canvas, params = {}, mood = 'studio', fov = 22, dof = null, cyc = {}, table = {} }) {
  const R = makeRenderer(canvas, W, H);
  const M = MOODS[mood];
  R.toneMappingExposure = M.exposure;
  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(R, mood);
  scene.environmentRotation = new THREE.Euler();
  const lights = addKeyLights(scene, mood);
  const cycM = makeCyc({ ...M.cyc, ...cyc }), tableM = makeTable({ ...M.table, ...table });
  scene.add(cycM, tableM);
  if (mood === 'warm') scene.add(bokehWall());
  const mirrors = new THREE.Group(); mirrors.scale.y = -1; scene.add(mirrors);
  // keep the focal length tied to frame width: a 4:5 or 1:1 render is an exact centre crop of the 9:16 framing
  const zoom = +(params.zoom || 1); // statics can widen the framing (zoom < 1)
  const vfov = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * H / 1920 / zoom) * 180 / Math.PI;
  const cam = new THREE.PerspectiveCamera(vfov, W / H, 1, 30000);
  const items = [];
  const set = {
    R, scene, cam, lights, mirrors, items, cyc: cycM, table: tableM,
    add(obj, { reflect = true, shadow = null } = {}) {
      scene.add(obj);
      const it = { obj };
      if (reflect) { it.mirror = obj.clone(); mirrors.add(it.mirror); }
      if (shadow) { it.shadow = contactShadow(shadow[0], shadow[1], shadow[2]); it.shadowOffset = shadow[3] || [0, 0]; scene.add(it.shadow); }
      items.push(it); return obj;
    },
    async stand(o = {}) {
      const s = makeStand({ ...o, qrData: await qrData() });
      if (o.pos) s.position.set(...o.pos);
      s.rotation.y = o.rotY || 0;
      set.add(s, { shadow: [72, 42, { blur: 0.32, opacity: 0.9 }, [0, -17]] });
      return s;
    },
    cup(o = {}) { const c = makeCup(); if (o.pos) c.position.set(...o.pos); c.rotation.y = o.rotY || 0; set.add(c, { shadow: [150, 150, { blur: 0.5, opacity: 0.8 }] }); return c; },
    phone(o = {}) { const p = makePhone(o); set.add(p, { reflect: o.reflect ?? true }); return p; },
    sync() {
      for (const it of items) {
        if (it.mirror) { it.mirror.position.copy(it.obj.position); it.mirror.quaternion.copy(it.obj.quaternion); it.mirror.scale.copy(it.obj.scale); it.mirror.visible = it.obj.visible; }
        if (it.shadow) {
          const o = it.obj, [dx, dz] = it.shadowOffset, c = Math.cos(o.rotation.y), s = Math.sin(o.rotation.y);
          it.shadow.position.set(o.position.x + dx * c + dz * s, 0.2 + o.position.y * 0, o.position.z - dx * s + dz * c);
          it.shadow.rotation.z = o.rotation.y; it.shadow.visible = o.visible && o.position.y < 5;
        }
      }
    },
    render() {
      set.sync();
      if (set.composer) set.composer.render(); else R.render(scene, cam);
    }
  };
  if (dof) {
    const comp = new EffectComposer(R);
    comp.setPixelRatio(1); comp.setSize(W, H);
    comp.addPass(new RenderPass(scene, cam));
    set.bokeh = new BokehPass(scene, cam, { focus: dof.focus ?? 500, aperture: dof.aperture ?? 0.0002, maxblur: dof.maxblur ?? 0.01 });
    comp.addPass(set.bokeh);
    comp.addPass(new OutputPass());
    set.composer = comp;
    set.focus = (f, a) => { set.bokeh.uniforms.focus.value = f; if (a !== undefined) set.bokeh.uniforms.aperture.value = a; };
  }
  return set;
}

// Out-of-focus café lights far behind the table (pre-blurred discs, additive).
function bokehWall() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
  const x = c.getContext('2d'); let sd = 11; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const cx = rnd() * 2048, cy = 180 + rnd() * 640, r = 30 + rnd() * 95, a = 0.06 + rnd() * 0.22, hue = 24 + rnd() * 16, l = 52 + rnd() * 14;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `hsla(${hue},92%,${l}%,${a * 0.8})`); g.addColorStop(0.7, `hsla(${hue},92%,${l}%,${a})`); g.addColorStop(0.9, `hsla(${hue},92%,${l - 6}%,${a * 0.5})`); g.addColorStop(1, 'hsla(30,90%,40%,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(5200, 2600), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.72 }));
  m.position.set(0, 700, -1900); return m;
}

export const look = (cam, pos, target) => { cam.position.set(...pos); cam.lookAt(...target); };
