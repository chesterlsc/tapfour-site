// Shots 2–8. Each is a pure function of the shot-local time t (seconds); beats and supers come from timeline.ts.
// Everything sits in the one dark studio of the product renders: real stands, real screens on realistic devices.
import React from 'react';
import { useVideoConfig } from 'remotion';
import { SUPERS, BEATS, ShotId, shot } from '../timeline';
import { SuperText, C, SANS, MONO, ease, easeIO, useInOut } from '../brand';
import { Frame, Studio, Layer, Stand, Ripple, Phone, Tablet, Screen, PHONE, TABLET, FACE, standPt, useT, useF, tween, keys, drift } from './kit';

export const Supers: React.FC<{ id: ShotId }> = ({ id }) => <>{SUPERS[id].map((s, i) => <SuperText key={i} {...s} />)}</>;
const useCount = (id: ShotId) => { const { fps } = useVideoConfig(); const s = shot(id); return Math.round((s.end - s.start) * fps); };
const PhoneScreen: React.FC<{ dir: string; id: ShotId }> = ({ dir, id }) => <Screen dir={dir} frame={useF()} count={useCount(id)} w={PHONE.sw} h={PHONE.sh} />;
const TabletScreen: React.FC<{ dir: string; id: ShotId }> = ({ dir, id }) => <Screen dir={dir} frame={useF()} count={useCount(id)} w={TABLET.sw} h={TABLET.sh} />;

/* 2 · Reveal — the two Review + Menu stands, slow lateral move with parallax */
export const ShotReveal: React.FC = () => {
  const t = useT();
  const k = tween(t, 0, 5.6, 0, 1, easeIO);
  return (
    <Frame>
      <Layer x={20 - k * 40} s={1.02 + k * 0.03}><Studio s={1.08} /></Layer>
      <Layer x={90 - k * 150} s={1 + k * 0.06} ox={1350} oy={820}>
        <Stand name="white-menu" x={1640} floor={790} s={0.27} sweep={tween(t, 1.2, 4.6, -0.3, 1.2)} />
      </Layer>
      <Layer x={120 - k * 200} s={1 + k * 0.07} ox={1350} oy={820}>
        <Stand name="black-menu" x={1220} floor={850} s={0.31} sweep={tween(t, 0.6, 4.0, -0.3, 1.2)} />
      </Layer>
      <Supers id="reveal" />
    </Frame>
  );
};

/* 3 · One tap — the phone touches the Review stand's contactless mark, then the review opens */
export const ShotTap: React.FC = () => {
  const t = useT(), B = BEATS.tap;
  const cut = 2.3;
  if (t < cut) {
    // close on the black Review stand; the phone comes in from the right and touches the mark at B.contact
    const push = tween(t, 0, cut, 0, 1, easeIO);
    const sx = 1040, fl = 1010, s = 0.4;
    const [gx, gy] = standPt(sx, fl, s, FACE.nfc);
    const a = tween(t, 0, B.contact, 0, 1, ease), back = tween(t, B.contact + 0.15, cut, 0, 1, easeIO);
    const px = 1790 - a * 520 + back * 90, py = 900 - a * 60 - back * 20;
    return (
      <Frame>
        <Layer s={1.06 + push * 0.05} ox={gx} oy={gy}>
          <Studio s={1.15} />
          <Stand name="black-review" x={sx} floor={fl} s={s} sweep={tween(t, 0.1, 1.3, -0.3, 1.1)}><Ripple t={t} at={B.contact} /></Stand>
          <Phone x={px} y={py} h={690} rz={-24 + a * 6 + back * 8} ry={-24 + a * 6} rx={4}><PhoneScreen dir="tap" id="tap" /></Phone>
        </Layer>
        <Supers id="tap" />
      </Frame>
    );
  }
  // the phone turns to camera; the stand stays behind, out of focus
  const lt = t - cut;
  const k = tween(lt, 0, 7.7, 0, 1, easeIO);
  const inn = tween(lt, 0, 0.9, 0, 1, ease);
  return (
    <Frame>
      <Layer s={1.04 + k * 0.05} x={-k * 30} blur={5 + inn * 2} dim={0.15}>
        <Studio s={1.1} />
        <Stand name="black-review" x={1700} floor={930} s={0.36} />
      </Layer>
      <Layer s={1 + k * 0.05} ox={1360} oy={540}>
        <Phone x={1360 + (1 - inn) * 60 + drift(t, 6, 1)} y={548 + drift(t, 5, 2)} h={880} ry={-12 + k * 6 + (1 - inn) * -8} rz={(1 - inn) * -6} rx={2}><PhoneScreen dir="tap" id="tap" /></Phone>
      </Layer>
      <Supers id="tap" />
    </Frame>
  );
};

/* 4 · Scan — the white Review + Menu stand beside the phone that is scanning it */
export const ShotScan: React.FC = () => {
  const t = useT(), B = BEATS.scan;
  const k = tween(t, 0, 10, 0, 1, easeIO);
  const focus = tween(t, B.menuUp - 0.2, B.menuUp + 0.8, 0, 1, easeIO); // rack focus from the stand to the menu on the phone
  return (
    <Frame>
      <Layer s={1.03 + k * 0.05} x={-k * 40} ox={1700} oy={700} blur={1 + focus * 5} dim={focus * 0.12}>
        <Studio s={1.1} />
        <Stand name="white-menu" x={1700} floor={905} s={0.34} />
      </Layer>
      <Layer s={1 + k * 0.04 + focus * 0.03} ox={1330} oy={540}>
        <Phone x={1320 + drift(t, 7, 3)} y={548 + drift(t, 6, 4)} h={880} ry={14 - k * 10} rz={-2 + drift(t, 0.8, 5)} rx={2}><PhoneScreen dir="scan" id="scan" /></Phone>
      </Layer>
      <Supers id="scan" />
    </Frame>
  );
};

/* 5 · Table ordering — the guest's phone at the table, then the staff tablet, then back to the guest */
const GuestPhone: React.FC<{ t: number; late?: boolean }> = ({ t, late }) => {
  const k = tween(t, late ? BEATS.order.cutPhone : 0, late ? 20 : BEATS.order.cutTablet, 0, 1, easeIO);
  return (
    <Frame>
      <Layer s={1.03 + k * 0.04} x={late ? 30 - k * 30 : -k * 30} blur={6} dim={0.15}>
        <Studio s={1.1} />
        <Stand name="black-menu" x={1730} floor={900} s={0.35} />
      </Layer>
      <Layer s={1 + k * 0.05} ox={1330} oy={540}>
        <Phone x={1330 + drift(t, 6, late ? 7 : 6)} y={548 + drift(t, 5, 8)} h={880} ry={late ? -10 + k * 4 : 10 - k * 8} rz={late ? 1 : -1.5} rx={2}><PhoneScreen dir="order" id="order" /></Phone>
      </Layer>
      <Supers id="order" />
    </Frame>
  );
};
export const ShotOrder: React.FC = () => {
  const t = useT(), B = BEATS.order;
  if (t < B.cutTablet) return <GuestPhone t={t} />;
  if (t >= B.cutPhone) return <GuestPhone t={t} late />;
  const k = tween(t, B.cutTablet, B.cutPhone, 0, 1, easeIO);
  return (
    <Frame>
      <Layer s={1.02 + k * 0.04} x={-k * 30}><Studio s={1.1} /></Layer>
      <Layer s={1 + k * 0.06} ox={1250} oy={560}>
        <Tablet x={1250} y={930 - 300} h={600} ry={-16 + k * 6} floor={930}><TabletScreen dir="order-tablet" id="order" /></Tablet>
      </Layer>
      <Supers id="order" />
    </Frame>
  );
};

/* 6 · Owner app — the real dashboard on the tablet; the camera moves in on the busiest-hours chart */
export const ShotOwner: React.FC = () => {
  const t = useT();
  const k = tween(t, 0, 12, 0, 1, easeIO);
  const push = tween(t, 5.6, 12, 0, 1, easeIO);
  const h = 640, cx = 1290, fl = 950, sc = h / TABLET.H;
  // chart centre on screen (css 484, 120) → design px
  const chx = cx + (-TABLET.W / 2 + TABLET.rim + TABLET.bezel + 484) * sc, chy = fl - h + (TABLET.rim + TABLET.bezel + 120) * sc;
  return (
    <Frame>
      <Layer s={1.02 + k * 0.04} x={-k * 20}><Studio s={1.1} /></Layer>
      <Layer s={1 + push * 0.2} ox={chx + 260} oy={chy} x={push * 60}>
        <Tablet x={cx} y={fl - h / 2} h={h} ry={-14 + k * 8} floor={fl}><TabletScreen dir="dash" id="owner" /></Tablet>
      </Layer>
      <Supers id="owner" />
    </Frame>
  );
};

/* 7 · Done for you — Google Business Profile before/after and the website on the phone, then the menu import */
const Chip: React.FC<{ text: string; at: number; out: number; x: number; y: number }> = ({ text, at, out, x, y }) => {
  const { opacity, y: dy } = useInOut(at, out, 0.4);
  return <div style={{ position: 'absolute', left: x, top: y + dy, opacity, padding: '9px 16px', borderRadius: 99, background: 'rgba(242,240,235,.08)', boxShadow: 'inset 0 0 0 1px rgba(242,240,235,.14)', color: C.lime, font: `600 17px ${MONO}`, letterSpacing: '0.1em' }}>{text}</div>;
};
export const ShotSetup: React.FC = () => {
  const t = useT(), B = BEATS.setup;
  if (t < B.cutMenu) {
    const k = tween(t, 0, B.cutMenu, 0, 1, easeIO);
    return (
      <Frame>
        <Layer s={1.02 + k * 0.04} x={-k * 30}><Studio s={1.1} /></Layer>
        <Layer s={1 + k * 0.05} ox={1360} oy={540}>
          <Phone x={1360 + drift(t, 6, 9)} y={548 + drift(t, 5, 10)} h={880} ry={12 - k * 16} rx={2}><PhoneScreen dir="setup-phone" id="setup" /></Phone>
        </Layer>
        <Chip text="BEFORE" at={0.3} out={B.gbpAfter + 0.3} x={1640} y={150} />
        <Chip text="AFTER" at={B.gbpAfter + 0.5} out={B.cutWeb - 0.1} x={1640} y={150} />
        <Supers id="setup" />
      </Frame>
    );
  }
  const k = tween(t, B.cutMenu, 10, 0, 1, easeIO);
  return (
    <Frame>
      <Layer s={1.02 + k * 0.03} x={-k * 20}><Studio s={1.1} /></Layer>
      <Layer s={1 + k * 0.05} ox={1280} oy={600}>
        <Tablet x={1290} y={940 - 310} h={620} ry={-12 + k * 6} floor={940}><TabletScreen dir="setup-tablet" id="setup" /></Tablet>
      </Layer>
      <Supers id="setup" />
    </Frame>
  );
};

/* 8 · Solo — five Review + Menu stands land in a row (four tables + the cashier), then the price */
const SOLO: { name: 'black-menu' | 'white-menu'; label: string }[] = [
  { name: 'black-menu', label: 'TABLE 1' }, { name: 'white-menu', label: 'TABLE 2' }, { name: 'black-menu', label: 'TABLE 3' },
  { name: 'white-menu', label: 'TABLE 4' }, { name: 'white-menu', label: 'CASHIER' }
];
const PriceCard: React.FC = () => {
  const B = BEATS.solo;
  const a = useInOut(B.card, 99, 0.8), b = useInOut(B.card + 0.3, 99, 0.8), c = useInOut(B.card + 0.6, 99, 0.8);
  return (
    <div style={{ position: 'absolute', right: 110, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
      <div style={{ opacity: a.opacity, transform: `translateY(${a.y}px)`, width: 640, padding: '40px 44px', borderRadius: 32, background: 'rgba(10,10,11,.86)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08), 0 30px 80px rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 17px ${MONO}`, letterSpacing: '0.08em' }}><span style={{ color: C.lime }}>SOLO PACKAGE</span><span style={{ color: C.m3 }}>1 LOCATION</span></div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 104, lineHeight: 0.92, letterSpacing: '-0.06em', color: C.fg }}>Solo.<br /><span style={{ color: C.lime }}>₱3,000.</span></div>
        <div style={{ opacity: b.opacity, transform: `translateY(${b.y}px)`, font: `500 21px ${MONO}`, letterSpacing: '0.04em', color: C.m1, lineHeight: 1.5 }}>5 stands · Google Review + Live Menu · Tables and cashier</div>
        <div style={{ opacity: c.opacity, font: `500 15px ${MONO}`, letterSpacing: '0.08em', color: C.m3 }}>ONE-TIME · + TAPFOUR APP ₱299/MO</div>
      </div>
    </div>
  );
};
export const ShotSolo: React.FC = () => {
  const t = useT(), B = BEATS.solo;
  const k = tween(t, 0, 10, 0, 1, easeIO);
  const side = tween(t, B.card - 0.5, B.card + 0.9, 0, 1, easeIO); // the row makes room for the price card
  const fl = 750, gap = 330, s = 0.25;
  return (
    <Frame>
      <Layer s={1.02 + k * 0.03}><Studio s={1.1} /></Layer>
      <Layer s={1 - side * 0.3} ox={960} oy={fl} x={-side * 390} y={side * 20}>
        {SOLO.map((st, i) => {
          const at = B.land[i];
          const d = tween(t, at - 0.55, at, 1, 0, ease); // 1 → 0 as it lands
          const lab = tween(t, at + 0.2, at + 0.7, 0, 1, ease);
          const x = 960 + (i - 2) * gap;
          return (
            <React.Fragment key={i}>
              <Stand name={st.name} x={x} floor={fl} s={s} lift={d * 90} opacity={tween(t, at - 0.55, at - 0.25, 0, 1)} />
              <div style={{ position: 'absolute', left: x - 100, width: 200, top: fl + 150, textAlign: 'center', opacity: lab * (1 - side * 0.2), font: `500 17px ${MONO}`, letterSpacing: '0.12em', color: C.m2 }}>{st.label}</div>
            </React.Fragment>
          );
        })}
      </Layer>
      <PriceCard />
    </Frame>
  );
};
