# Tapfour Connect: launch film plan

A ~90 s launch film for restaurant and café owners in the Philippines. After watching, an owner knows what happens when a guest taps, scans and orders, and what the Solo package gives them.

Everything lives in `film/`, a Remotion (React/TS) project.

| Path | What it is |
|---|---|
| `src/timeline.ts` | Every shot and super timing (seconds), plus the frame rate and resolution helpers. |
| `src/shots/*` | One composition per shot, plus a `Film` composition that sequences them. |
| `src/screens/*` | The 2D screen compositions that play on the phone and tablet. They are rendered first and then mapped onto the 3D devices as video textures. |
| `capture/*` | Runs the real platform Worker locally with fictional seed data. Playwright then captures the real UI at 3× device scale. |
| `audio/*` | Original synthesized sound design and music bed (Python + numpy). |
| `render.mjs` | Renders screens, then the film, then the audio stem. `--scale 2` gives 4K, `--fps 60` gives 60 fps; layouts stay the same. |

## Recon

- **Source repo.** `chesterlsc/tap4` is at the same commit as this repo (`505de21`), so this repo is the source of truth.
- **Stack.**
  - The storefront is a Shopify OS 2.0 theme with a static preview (`scripts/preview.mjs`).
  - The product is `platform/`, a Cloudflare Worker (Hono + D1). It serves taps, the live QR menu, the links page and the owner dashboard.
  - Pages are server-rendered HTML on `platform/src/base.css`.
- **Brand tokens.**
  - Colours: `--bg #0a0a0b`, `--fg #f2f0eb`, `--lime #c8f23c`, greys `#d6d4ce` to `#5d5c59`, card `#121214`.
  - Type: Instrument Sans 400–700 for headings, 700 weight with −.045 to −.065em tracking. JetBrains Mono for uppercase labels at +.06 to .16em.
  - Font files: `assets/*.woff2`.
- **Logo.**
  - The two-leaf mark exists as SVG only in `assets/favicon.svg`; `.tf-mark` is the same mark in CSS.
  - The film uses the favicon's leaf paths without the tile. Lockup is mark plus "tapfour" in Instrument Sans 700 at −.045em, mark height = font size, gap .38em (from `.brand` in `sections/header.liquid`). The mark never appears alone.
- **Pricing and packages** (`templates/index.json`, `assets/theme.js` `PKGS`, `products.csv`):
  - **Solo** is ₱3,000 one-time for **5 Review + Menu stands** (TAP4.1 L-Stand, glossy black or white), plus the tapfour app at ₱299/mo.
  - The site's Solo sample places them at Counter and Tables 1–4. This matches the brief ("5 stands · Google Review + Live Menu · Tables and cashier"), so there is no conflict to stop on.
  - **Table ordering** is an add-on from ₱499/mo, priced by quote.
  - **Services** (`tf-services`):
    - Google profile setup ₱1,800
    - Menu setup ₱2,500
    - Page build ₱1,500 (the hosted business page)

### Routes used (real, local)

| Flow | Route | Handler |
|---|---|---|
| NFC tap → Google review | `GET /t/K4NT07` → `302 https://g.page/r/kanto-coffee-example/review` | `platform/src/index.js:48`, `lib.js:97` |
| QR scan → live menu | `GET /q/K4NT01/menu` → `302 /menu/kanto-coffee?d=K4NT01` | same |
| Live menu | `GET /menu/kanto-coffee` | `index.js:90`, `views.js:1046` `menuPage` |
| Business page ("website") | `GET /p/kanto-coffee` | `index.js:99`, `views.js:362` `linksPage` |
| Owner dashboard | `GET /app` (owner login) | `owner.js:49`, `views.js:805` `ownerOverview` |
| Menu editor | `GET /app/menu`, `POST /app/menu/:id`, `/soldout` | `modules.js:36–71` |

- **Local run.** `capture/wrangler.film.toml` is a film-only config. It has no routes or custom domains, placeholder D1/KV IDs, and `--persist-to capture/.state`.
- **Seed data.** `capture/seed.mjs` writes fictional **Kanto Coffee** data:
  - 13 Filipino café items with ₱ prices.
  - 6 stands: 1 black Review stand, plus the 5 Solo Review + Menu stands.
  - About 2,900 taps over 30 days with café-shaped hours.
  - The owner login `owner@kantocoffee.example`.
- **Nothing touches production.**

## Shot list (the order is fixed; the times are in `src/timeline.ts`)

| # | Time | Shot | Build | Supers |
|---|---|---|---|---|
| 1 | 0:00–0:07 | **Open.** Dark studio, slow push-in on the black Review stand, lime edge, floor reflection. Lockup and "Tapfour Connect" at 0:04. | Supplied 4K render `e94664c9` with a 2.5D push, background extended and a light sweep added. | lockup + "Tapfour Connect" |
| 2 | 0:07–0:12 | **Reveal.** Lime studio, black and white Review + Menu stands side by side, slow parallax. | 3D (no lime-studio render was supplied). | "Reviews. Menu. Orders. One stand." |
| 3 | 0:12–0:22 | **One tap.** Phone meets the NFC mark, lime ripple, haptic jolt. Then on screen: NFC banner, browser loading `go.tap4.ph/t/K4NT07`, redirect to the Google write-a-review sheet for Kanto Coffee, stars fill 1 to 5. | 3D stand + phone; screen comp. | "One tap." / "Your Google review. Instantly." |
| 4 | 0:22–0:32 | **Scan.** White Review + Menu stand. Camera viewfinder drifts with a focus pull, brackets lock, link pill appears, a tap slides up the real menu. Ube Cheese Pandesal flips to Sold out; Calamansi Cold Brew goes ₱190 → ₱175. | 3D + screen comp (real menu, both states captured after real edits in `/app/menu`). | "Scan. A menu that's alive." |
| 5 | 0:32–0:52 | **Table ordering.** The guest browses and adds 3 items, then taps "Place order · Table 7". The counter tablet shows "New order · Table 7 · 3 items" with a chime; the server opens the order and taps Accept. The guest sees "Order received" change to "Preparing". | 3D phone on a café table, tablet on the counter; built-for-film screens. | "Order from the table." / "Straight to your staff." |
| 6 | 0:52–1:04 | **Owner app.** The real dashboard on a tablet: TODAY numbers count up, the busiest-hours chart draws in, the "what guests opened" list fills. | 3D tablet; real `/app` driven frame by frame in Playwright. | "Meet the tapfour app." / "Know your busiest hours." |
| 7 | 1:04–1:14 | **Done for you.** Google Business Profile before and after; the Kanto Coffee page tapfour builds; menu setup in `/app/menu`. | 3D devices; GBP built for the film; page and menu editor real. | "We set it all up." + "Google Business Profile · Website · Menu" |
| 8 | 1:14–1:24 | **Solo.** High top-down view of the café; five L-stands land one by one, four on tables and one at the cashier. Price card. | 3D. | "Solo. ₱3,000." + "5 stands · Google Review + Live Menu · Tables and cashier" |
| 9 | 1:24–1:30 | **End card.** Black, lockup, master tagline, tap4.ph. | 2D | tagline |

## Asset map

| Shot | Screen / asset | Source |
|---|---|---|
| 1 | Black Review stand, dark studio | Supplied render (upload `e94664c9`, 2160×3840) |
| 2, 3, 4, 5, 8 | Stand artwork: "Leave us a review" and "Review or view our menu", black and white | Rebuilt as vector artwork from the renders and `assets/tapfour-l-*.jpg`: brand fonts, favicon leaf paths, Google G, NFC glyph. The QR is generated with the platform's own `qrcode-generator` and has a leaf centre like the product. |
| 3 | `go.tap4.ph/t/K4NT07` → `g.page/...` redirect | Real 302 from the local Worker. The URLs shown in the browser bar are the ones it returned. |
| 4 | Live menu, before and after | **Real** `/menu/kanto-coffee`, captured before and after real `/app/menu` edits (sold out + price). |
| 6 | Owner dashboard | **Real** `/app` overview, Kanto Coffee seed data. |
| 7 | Business page | **Real** `/p/kanto-coffee`. |
| 7 | Menu setup | **Real** `/app/menu` ("Your menu.", "Add to menu"). |

## Built for the film (not in the repo)

Each of these is built with the repo's own tokens and `base.css` components (fonts, `.pill`, `.btn`, card and tile styles, the `.mn__*` menu styles) and is captured the same way as the real screens.

1. **Guest table-ordering menu** (phone). This is the real `/menu` layout plus +/- steppers and a cart bar reading "Place order · Table 7". Strings follow the site's ordering demo (`assets/theme.js` `renderAppSection`). The platform has no ordering routes yet; see `views.js:1114`, "the ordering screens aren't built yet".
2. **Guest order status** (phone): "Order received", then "Preparing".
3. **Counter tablet: orders.** A notification slides in ("New order · Table 7 · 3 items"), the order card opens, then Accept. It is the owner-app shell (sidebar, cards) with the site demo's popup wording "Accept · send to kitchen".
4. **Google "write a review" sheet** for Kanto Coffee. Recreated because it is not in the repo; the brief allows this exception.
5. **Google Business Profile, before and after** (Maps listing: photos, hours, menu link, categories). Recreated, fictional.
6. **Phone system chrome**: status bar, NFC tag banner, browser URL bar with loading progress, camera viewfinder with QR brackets and link pill. These are generic and unbranded.

## Gaps and calls made

- **Table ordering is not built in the platform yet.**
  - Screens 1–3 above are built for the film.
  - Table ordering is also a paid add-on (from ₱499/mo), so the ordering super carries a small "TABLE ORDERING · ADD-ON" label. The Solo card does not claim it.
- **"Orders" count on the dashboard.**
  - The real dashboard tracks taps, QR scans, opened review and menu views, but not orders.
  - Shot 6 counts up the real four and does not invent an orders tile.
  - The "most-opened" list is the dashboard's real "what guests opened" split.
- **"Website".**
  - tapfour has no website-build service. The closest real product is the hosted business page (`/p/<slug>`, the "Page build" service, "My page" in the app), and that is what shot 7 shows.
  - The subline keeps the brief's wording; see the summary for this flag.
- **Solo pricing.** The price card adds a small "ONE-TIME · tapfour app ₱299/mo" line so the ₱3,000 is not misread as all-in.
- **Renders.**
  - `./assets/renders/` (16 stills) was not in the repo.
  - I used the four renders supplied in the chat (4K, dark studio with floor reflection) and the repo's `tapfour-l-*.jpg` photos as reference.
  - There are no lime-studio or leaf-shadow stills, so those setups are 3D. The "Connect with us" render is never used.
- **Hands.** A procedural 3D hand would not pass as natural, so device shots are framed so the hand is just out of frame (the phone carries handheld drift), or the device rests on a table or counter. Touches show as soft touch points.

## Pitch (tap4.ph hero)

- **Master tagline (end card):** Every table, connected.
- **Alternates:**
  1. One tap to review. One scan to order.
  2. Reviews, menu and orders. On one stand.
  3. Your café, one tap away.
- **Product description:** Tapfour Connect is a glossy stand for every table: guests tap to leave a Google review, scan for a live menu that's always up to date, and, with table ordering, send orders straight to your staff, while the tapfour app shows you what's working.
