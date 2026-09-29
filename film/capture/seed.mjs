// Film demo data: one fictional café, "Kanto Coffee". LOCAL ONLY — applied with
// `wrangler d1 execute --local -c wrangler.film.toml` (see setup.sh). Never load into the live database.
// Events are generated relative to "now" so the dashboard's TODAY and 30-day views are full and believable.
import { writeFileSync } from 'node:fs';
import { hashPassword } from '../../platform/src/lib.js';

export const OWNER = { email: 'owner@kantocoffee.example', password: 'kanto-film-local' };
const q = s => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);

// Deterministic PRNG so every capture run shows the same numbers.
let seed = 20260929;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const MENU = [
  ['Coffee', 'Kanto Latte', 'House blend · fresh or oat milk', 16000],
  ['Coffee', 'Barako Americano', 'Batangas barako, hot or iced', 12000],
  ['Coffee', 'Spanish Latte', 'Condensed milk, cinnamon', 17000],
  ['Coffee', 'Ube Latte', 'Ube halaya, double shot', 18500],
  ['Coffee', 'Calamansi Cold Brew', '18-hour brew, calamansi', 19000],
  ['Pastries', 'Ensaymada', 'Butter, sugar, queso', 9500],
  ['Pastries', 'Ube Cheese Pandesal', '3 pcs, warm', 12000],
  ['Pastries', 'Bibingka', 'Salted egg, cheese', 11000],
  ['Pastries', 'Turon', 'Saba, langka, caramel', 8500],
  ['All-day silog', 'Tapsilog', 'Beef tapa, garlic rice, egg', 24500],
  ['All-day silog', 'Longsilog', 'Lucban longganisa, garlic rice, egg', 22500],
  ['All-day silog', 'Tocilog', 'Sweet pork tocino, garlic rice, egg', 21500],
  ['All-day silog', 'Champorado', 'Tablea, tuyo on the side', 15000]
];

// Review stand (black, NFC only) + the Solo package: 5 Review + Menu stands (counter + 4 tables).
const DEVICES = [
  ['K4NT07', 'Review stand · Counter', 'TF-L41-BLK', [['main', 'google']]],
  ['K4NT01', 'Review + Menu · Cashier', 'TF-L41-WHT', [['main', 'google'], ['menu', 'menu']]],
  ['K4NT02', 'Review + Menu · Table 1', 'TF-L41-BLK', [['main', 'google'], ['menu', 'menu']]],
  ['K4NT03', 'Review + Menu · Table 2', 'TF-L41-WHT', [['main', 'google'], ['menu', 'menu']]],
  ['K4NT04', 'Review + Menu · Table 3', 'TF-L41-BLK', [['main', 'google'], ['menu', 'menu']]],
  ['K4NT05', 'Review + Menu · Table 4', 'TF-L41-WHT', [['main', 'google'], ['menu', 'menu']]]
];

// Café traffic by PH hour (opens 7AM, closes 10PM): morning rush, lunch, merienda.
const HOUR_W = { 7: 4, 8: 9, 9: 12, 10: 8, 11: 6, 12: 9, 13: 7, 14: 5, 15: 8, 16: 9, 17: 6, 18: 7, 19: 5, 20: 3, 21: 2 };

function events(now = Date.now()) {
  const rows = [];
  const hours = Object.entries(HOUR_W).map(([h, w]) => [Number(h), w]);
  const pickHour = () => { let r = rnd() * hours.reduce((a, [, w]) => a + w, 0); for (const [h, w] of hours) { if ((r -= w) < 0) return h; } return 9; };
  const phNow = new Date(now + 8 * 3600e3);
  const phMidnightUtc = Date.UTC(phNow.getUTCFullYear(), phNow.getUTCMonth(), phNow.getUTCDate()) - 8 * 3600e3;
  for (let day = 0; day < 30; day++) {
    const perDay = Math.round(70 + 40 * (1 - day / 30) + rnd() * 18); // busier recently
    for (let i = 0; i < perDay; i++) {
      const h = pickHour();
      const ts = phMidnightUtc - day * 864e5 + (h - 0) * 3600e3 + Math.floor(rnd() * 3600e3);
      // Today is always a full café day (7AM–10PM PH), whatever time the capture runs: the dashboard's TODAY
      // query has no upper bound, and a future timestamp reads as "just now". Past days stop at the present.
      if (day > 0 && ts > now - 60e3) continue;
      const dev = DEVICES[Math.floor(rnd() * DEVICES.length)];
      const menuStand = dev[3].length > 1;
      const isMenu = menuStand && rnd() < 0.5;
      const source = isMenu ? (rnd() < 0.85 ? 'qr' : 'nfc') : (rnd() < 0.9 ? 'nfc' : 'qr');
      rows.push([new Date(ts).toISOString().replace('T', ' ').slice(0, 19), dev[0], isMenu ? 'menu' : 'main', source, isMenu ? 'menu' : 'google', 'v' + Math.floor(rnd() * 900)]);
    }
  }
  return rows;
}

export async function buildSql(now = Date.now()) {
  const hash = await hashPassword(OWNER.password);
  const ev = events(now);
  const out = [
    'DELETE FROM menu_items; DELETE FROM bills; DELETE FROM stock_items; DELETE FROM staff; DELETE FROM branches; DELETE FROM sessions; DELETE FROM users; DELETE FROM events; DELETE FROM audit_log; DELETE FROM device_slots; DELETE FROM devices; DELETE FROM business_links; DELETE FROM businesses;',
    `INSERT INTO businesses (id, slug, name, brand_color, contact_name, email, phone, plan, billing, package, table_ordering) VALUES (1, 'kanto-coffee', 'Kanto Coffee', NULL, 'Mara Dizon', 'hello@kantocoffee.example', '+63 917 000 0107', 'solo', 'monthly', 'solo', 'active');`,
    `INSERT INTO business_links (business_id, key, url) VALUES (1, 'google', 'https://g.page/r/kanto-coffee-example/review'), (1, 'facebook', 'https://facebook.com/kantocoffee.example'), (1, 'instagram', 'https://instagram.com/kantocoffee.example');`,
    `INSERT INTO branches (business_id, name, address) VALUES (1, 'Maginhawa', 'Maginhawa St, Quezon City');`,
    ...DEVICES.map(([code, label, sku]) => `INSERT INTO devices (code, label, business_id, product_sku, branch, status, created_at, first_scan_at, qc_at, qc_by, activated_at) VALUES (${q(code)}, ${q(label)}, 1, ${q(sku)}, 'Maginhawa', 'active', datetime('now','-31 days'), datetime('now','-31 days'), datetime('now','-31 days'), 'film@local', datetime('now','-30 days'));`),
    ...DEVICES.flatMap(([code, , , slots]) => slots.map(([s, k]) => `INSERT INTO device_slots (device_code, slot, link_key) VALUES (${q(code)}, ${q(s)}, ${q(k)});`)),
    ...MENU.map(([c, n, note, p], i) => `INSERT INTO menu_items (business_id, category, name, note, price_cents, sold_out, sort) VALUES (1, ${q(c)}, ${q(n)}, ${q(note)}, ${p}, 0, ${i + 1});`),
    `INSERT INTO bills (business_id, branch, name, amount_cents, due_date, repeat_monthly) VALUES (1, 'Maginhawa', 'Barako bean supplier', 840000, date('now', '+8 hours', '+2 days'), 1), (1, 'Maginhawa', 'Electricity', 612000, date('now', '+8 hours', '+5 days'), 1);`,
    `INSERT INTO stock_items (business_id, branch, name, unit, qty, low_at) VALUES (1, 'Maginhawa', 'Oat milk', 'L', 3, 5), (1, 'Maginhawa', 'Barako beans', 'kg', 9, 3), (1, 'Maginhawa', 'Cups · 12 oz', 'pcs', 240, 100);`,
    `INSERT INTO users (email, name, password_hash, role, business_id) VALUES (${q(OWNER.email)}, 'Mara Dizon', ${q(hash)}, 'owner', 1);`
  ];
  for (let i = 0; i < ev.length; i += 200) {
    out.push('INSERT INTO events (ts, device_code, business_id, slot, source, link_key, visitor, country, bot) VALUES ' +
      ev.slice(i, i + 200).map(([ts, code, slot, src, key, v]) => `(${q(ts)}, ${q(code)}, 1, ${q(slot)}, ${q(src)}, ${q(key)}, ${q(v)}, 'PH', 0)`).join(', ') + ';');
  }
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(new URL('./.state/seed-film.sql', import.meta.url), await buildSql());
  console.log('wrote .state/seed-film.sql');
}
