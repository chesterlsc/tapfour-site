// Screen compositions for shots 5–7. Real repo UI: the live menu page, the owner dashboard (/app), the business
// page (/p/kanto-coffee) and the menu editor (/app/menu). Built for the film (PLAN.md): the table-ordering
// steppers/cart/status on the guest phone, the counter-tablet Orders screen, and Google's Business Profile.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, SANS, ease } from '../brand';
import { BEATS } from '../timeline';
import { Device, StatusBar, BrowserBar, PH, TB, Touch, Page, cap, useSec, tw } from './ui';
import meta from '../../public/capture/meta.json';

const top = PH.status + PH.bar;

/* ---------- 5a · guest phone: browse, add 3 items, place order · Table 7, then status ---------- */
export const ScreenOrderGuest: React.FC = () => {
  const t = useSec(), B = BEATS.order;
  const adds = meta.order.steps[0].adds;
  const scroll = tw(t, 2.1, 2.9, 0, 333) + tw(t, 3.55, 4.35, 0, 358);
  const step = t >= B.add3 + 0.05 ? 3 : t >= B.add2 + 0.05 ? 2 : t >= B.add1 + 0.05 ? 1 : 0;
  const cartIn = tw(t, B.add1 + 0.05, B.add1 + 0.45, 0, 1, ease);
  const cb = meta.order.cart, btn = meta.order.cartBtn;
  const pressed = t > B.place - 0.05 && t < B.place + 0.2;
  const status = tw(t, B.place + 0.35, B.place + 0.85, 0, 1, ease);
  const prep = tw(t, B.preparing, B.preparing + 0.45);
  const tabs = meta.order.steps[0].tabs;
  const pt = (i: number) => ({ x: adds[i].x + adds[i].w / 2, y: top + adds[i].y + adds[i].h / 2 });
  return (
    <Device w={PH.w} h={PH.h}>
      <Page src={cap(`order-${step}.png`)} top={top} scroll={scroll} />
      {scroll > tabs.y && <Img src={cap('order-tabs-0.png')} style={{ position: 'absolute', left: 0, top, width: PH.w, zIndex: 5 }} />}
      {step > 0 && (
        <Img src={cap(`order-cart-${step}.png`)} style={{ position: 'absolute', left: cb.x, top: cb.y + (1 - cartIn) * 110, width: cb.w, zIndex: 6, transform: pressed ? 'scale(.98)' : undefined, transformOrigin: `${btn.x - cb.x + btn.w / 2}px 50%` }} />
      )}
      {status > 0 && (
        <AbsoluteFill style={{ opacity: status, transform: `translateY(${(1 - status) * 24}px)`, background: C.bg, zIndex: 20 }}>
          <Page src={cap('order-received.png')} top={top - 10} scroll={0} />
          <Page src={cap('order-preparing.png')} top={top - 10} scroll={0} opacity={prep} />
        </AbsoluteFill>
      )}
      <BrowserBar url="go.tap4.ph/menu/kanto-coffee" />
      <StatusBar />
      <Touch {...pt(0)} at={B.add1} t={t} />
      <Touch x={pt(5).x} y={pt(5).y - scroll} at={B.add2} t={t} />
      <Touch x={pt(9).x} y={pt(9).y - scroll} at={B.add3} t={t} />
      <Touch x={btn.x + btn.w / 2} y={btn.y + btn.h / 2} at={B.place} t={t} />
    </Device>
  );
};

/* ---------- 5b · counter tablet: new order → open → Accept ---------- */
export const ScreenOrderTablet: React.FC = () => {
  const t = useSec(), B = BEATS.order;
  const toast = meta.ordersToast, card = meta.ordersCard, acc = meta.ordersAccept;
  const tin = tw(t, B.toast, B.toast + 0.5, 0, 1, ease), tout = tw(t, B.open - 0.1, B.open + 0.2);
  const modal = tw(t, B.open, B.open + 0.4, 0, 1, ease) * (1 - tw(t, B.accept + 0.15, B.accept + 0.45));
  const base = t >= B.accept + 0.3 ? 'orders-2' : t >= B.toast ? 'orders-1' : 'orders-0';
  return (
    <Device w={TB.w} h={TB.h}>
      <Img src={cap(`${base}.png`)} style={{ position: 'absolute', left: 0, top: 0, width: TB.w }} />
      {t >= B.accept + 0.2 && <Img src={cap('orders-1.png')} style={{ position: 'absolute', left: 0, top: 0, width: TB.w, opacity: 1 - tw(t, B.accept + 0.2, B.accept + 0.5) }} />}
      {tin > 0 && tout < 1 && <Img src={cap('orders-toast.png')} style={{ position: 'absolute', left: toast.x + (1 - tin) * 480, top: toast.y, width: toast.w, opacity: 1 - tout, transform: `scale(${1 - tout * 0.04})` }} />}
      {modal > 0 && <>
        <AbsoluteFill style={{ background: 'rgba(5,5,6,.6)', opacity: modal }} />
        <Img src={cap('orders-card.png')} style={{ position: 'absolute', left: card.x, top: card.y, width: card.w, opacity: modal, transform: `scale(${0.94 + 0.06 * modal})` }} />
      </>}
      <Touch x={toast.x + toast.w - 60} y={toast.y + toast.h / 2} at={B.open - 0.15} t={t} size={60} />
      <Touch x={acc.x + acc.w / 2} y={acc.y + acc.h / 2} at={B.accept} t={t} size={60} />
    </Device>
  );
};

/* ---------- 6 · owner dashboard (REAL /app): numbers count up, busiest hours draw in, what guests opened ---------- */
export const ScreenDash: React.FC = () => {
  const t = useSec();
  const idx = Math.max(0, Math.min(150, Math.round((t - BEATS.owner.count) * 30)));
  const scroll = tw(t, 2.5, 3.5, 0, 232);
  return (
    <Device w={TB.w} h={TB.h}>
      <Img src={cap(`dash/${String(idx).padStart(3, '0')}.jpg`)} style={{ position: 'absolute', left: 0, top: -scroll, width: TB.w }} />
      {/* .app__side is position: sticky (100svh): the sidebar stays while the page scrolls */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 236, height: TB.h, overflow: 'hidden' }}>
        <Img src={cap(`dash/${String(idx).padStart(3, '0')}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: TB.w }} />
      </div>
    </Device>
  );
};

/* ---------- 7a · phone: Google Business Profile before → after, then the business page tapfour builds ---------- */
const ROBOTO = "'Roboto', system-ui, sans-serif";
const Stars: React.FC<{ n: number }> = ({ n }) => <span style={{ color: '#fbbc04', letterSpacing: 1 }}>{'★★★★★'.slice(0, Math.round(n))}<span style={{ color: '#dadce0' }}>{'★★★★★'.slice(Math.round(n))}</span></span>;
const Row: React.FC<{ icon: React.ReactNode; children: React.ReactNode; blue?: boolean }> = ({ icon, children, blue }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '13px 20px', borderTop: '1px solid #f1f3f4', font: `400 15px ${ROBOTO}`, color: blue ? '#1a73e8' : '#202124' }}>
    <span style={{ width: 22, display: 'grid', placeItems: 'center', color: '#1a73e8' }}>{icon}</span><span>{children}</span>
  </div>
);
const I = {
  pin: <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#1a73e8" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>,
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"><path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M16 3c-1.7 1-2.5 3.3-2.5 6h2.5v12" /></svg>,
  tag: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8" r="1.4" fill="#1a73e8" /></svg>
};
const GbpMap: React.FC = () => (
  <svg width={PH.w} height={230} viewBox={`0 0 ${PH.w} 230`} style={{ position: 'absolute', top: 0, left: 0 }}>
    <rect width="100%" height="100%" fill="#eef0e8" />
    <rect x="-20" y="40" width="440" height="60" fill="#dfe8d4" />
    {[[0, 120, 393, 150, 14], [60, 0, 110, 230, 10], [250, 0, 300, 230, 9], [0, 60, 393, 40, 7], [0, 205, 393, 190, 6]].map(([a, b, c, d, w], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#fff" strokeWidth={w} />)}
    <text x="130" y="112" fontFamily="Roboto" fontSize="11" fill="#6f7c86">Maginhawa St</text>
    <g transform="translate(196 150)"><path d="M0 -38c-11 0-19 8-19 19 0 14 19 31 19 31s19-17 19-31c0-11-8-19-19-19z" fill="#ea4335" /><circle cy="-19" r="7" fill="#a50e0e" /></g>
  </svg>
);
const Gbp: React.FC<{ after: boolean }> = ({ after }) => (
  <AbsoluteFill style={{ background: '#fff', fontFamily: ROBOTO, color: '#202124' }}>
    <GbpMap />
    <div style={{ position: 'absolute', left: 12, right: 12, top: PH.status + 6, height: 46, borderRadius: 23, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.2)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14, font: `400 16px ${ROBOTO}` }}>
      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="#5f6368" strokeWidth="2.2" fill="none" strokeLinecap="round" /></svg>Kanto Coffee
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 200, bottom: 0, background: '#fff', borderRadius: '18px 18px 0 0', boxShadow: '0 -2px 10px rgba(0,0,0,.12)' }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: '#dadce0', margin: '8px auto 0' }} />
      <div style={{ padding: '10px 20px 0' }}>
        <div style={{ font: `400 25px ${ROBOTO}` }}>Kanto Coffee</div>
        <div style={{ font: `400 14px ${ROBOTO}`, color: '#70757a', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>4.6 <Stars n={4.6} /> (128){after && <> · ₱100–250</>}</div>
        <div style={{ font: `400 14px ${ROBOTO}`, color: '#70757a', marginTop: 3 }}>{after ? 'Coffee shop · Café · Breakfast restaurant' : 'Coffee shop'}</div>
        <div style={{ font: `400 14px ${ROBOTO}`, marginTop: 3, color: after ? '#188038' : '#70757a' }}>{after ? <>Open <span style={{ color: '#70757a' }}>· Closes 10 PM</span></> : 'Hours not listed'}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '14px 20px', overflow: 'hidden' }}>
        {['Directions', 'Call', ...(after ? ['Menu', 'Website'] : []), 'Save', 'Share'].map((l, i) => (
          <span key={l} style={{ padding: '8px 14px', borderRadius: 18, font: `500 14px ${ROBOTO}`, whiteSpace: 'nowrap', background: i === 0 ? '#1a73e8' : '#e8f0fe', color: i === 0 ? '#fff' : '#1967d2' }}>{l}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 20px 12px', height: 132 }}>
        {[1, 2, 3].map(i => after
          ? <Img key={i} src={staticFile(`art/photo-${i}.jpg`)} style={{ width: i === 1 ? 150 : 100, height: 120, objectFit: 'cover', borderRadius: i === 1 ? '10px 0 0 10px' : i === 3 ? '0 10px 10px 0' : 0 }} />
          : <div key={i} style={{ width: i === 1 ? 150 : 100, height: 120, background: '#f1f3f4', borderRadius: i === 1 ? '10px 0 0 10px' : i === 3 ? '0 10px 10px 0' : 0, display: 'grid', placeItems: 'center', color: '#9aa0a6', font: `500 12px ${ROBOTO}` }}>{i === 1 ? '+ Add photos' : ''}</div>)}
      </div>
      <Row icon={I.pin}>Maginhawa St, Quezon City</Row>
      {after ? <>
        <Row icon={I.clock}><span style={{ color: '#188038' }}>Open</span> · Closes 10 PM · Opens 7 AM</Row>
        <Row icon={I.menu} blue>go.tap4.ph/menu/kanto-coffee</Row>
        <Row icon={I.globe} blue>go.tap4.ph/p/kanto-coffee</Row>
        <Row icon={I.tag}>Coffee shop · Café · Breakfast restaurant</Row>
      </> : <>
        <Row icon={I.clock}><span style={{ color: '#1a73e8' }}>Add hours</span></Row>
        <Row icon={I.globe}><span style={{ color: '#1a73e8' }}>Add website</span></Row>
      </>}
    </div>
  </AbsoluteFill>
);

export const ScreenSetupPhone: React.FC = () => {
  const t = useSec(), B = BEATS.setup;
  const wipe = tw(t, B.gbpAfter, B.gbpAfter + 0.9, 0, 1, ease);
  const web = tw(t, B.cutWeb, B.cutWeb + 0.5, 0, 1, ease);
  const edge = wipe * (PH.w + 40) - 20;
  return (
    <Device w={PH.w} h={PH.h} bg="#fff">
      <Gbp after={false} />
      <AbsoluteFill style={{ clipPath: `inset(0 ${PH.w - edge}px 0 0)` }}><Gbp after /></AbsoluteFill>
      {wipe > 0 && wipe < 1 && <div style={{ position: 'absolute', top: 0, bottom: 0, left: edge - 1, width: 2, background: C.lime, boxShadow: `0 0 16px ${C.lime}` }} />}
      <StatusBar light />
      {web > 0 && (
        <AbsoluteFill style={{ transform: `translateX(${(1 - web) * PH.w}px)`, background: C.bg, boxShadow: '-10px 0 40px rgba(0,0,0,.3)' }}>
          <Page src={cap('page-kanto.png')} top={top} scroll={0} />
          <BrowserBar url="go.tap4.ph/p/kanto-coffee" progress={tw(t, B.cutWeb, B.cutWeb + 0.5)} progressOpacity={1 - tw(t, B.cutWeb + 0.5, B.cutWeb + 0.8)} />
          <StatusBar />
        </AbsoluteFill>
      )}
      <Touch x={318} y={347} at={B.cutWeb - 0.2} t={t} light />
    </Device>
  );
};

/* ---------- 7b · tablet: menu setup in the REAL /app/menu (paste the whole menu → added) ---------- */
export const ScreenSetupTablet: React.FC = () => {
  const t = useSec(), B = BEATS.setup;
  const pasted = tw(t, B.paste, B.paste + 0.25);
  const scroll = tw(t, B.paste + 0.2, B.paste + 0.75, 0, 337);
  const added = tw(t, B.added, B.added + 0.35);
  const btn = meta.setupButton;
  return (
    <Device w={TB.w} h={TB.h}>
      <Img src={cap('setup-0.png')} style={{ position: 'absolute', left: 0, top: 0, width: TB.w, opacity: 1 - pasted }} />
      <Img src={cap('setup-1.png')} style={{ position: 'absolute', left: 0, top: -scroll, width: TB.w, opacity: pasted * (1 - added) }} />
      <Img src={cap('setup-2.png')} style={{ position: 'absolute', left: 0, top: 0, width: TB.w, opacity: added }} />
      <Touch x={700} y={560} at={B.paste - 0.15} t={t} size={60} />
      <Touch x={btn.x + btn.w / 2} y={btn.y + btn.h / 2 - 337} at={B.added - 0.25} t={t} size={60} />
    </Device>
  );
};
