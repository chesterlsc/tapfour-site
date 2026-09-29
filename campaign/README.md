# Tapfour launch campaign

Master Instagram Reel (9:16, 81 s) plus a 30 s Reel, a 15 s performance Reel, a LinkedIn 4:5 film and a static/carousel set. Everything is rendered from this folder: a 3D model of the real TAP4.1 L-Stand, the **real** tapfour dashboard and guest pages captured from `platform/`, motion typography and an original synthesized score.

| Deliverable | File | Format |
|---|---|---|
| Master Reel | `deliverables/tapfour-master.mp4` | 1080 × 1920, 30 fps, H.264 High + AAC 256k, −14 LUFS, 80.8 s |
| 30 s Reel | `deliverables/tapfour-reel-30s.mp4` | 1080 × 1920, 30.3 s |
| 15 s performance Reel | `deliverables/tapfour-reel-15s.mp4` | 1080 × 1920, 15.1 s |
| LinkedIn | `deliverables/tapfour-linkedin-4x5.mp4` | 1080 × 1350, 54.9 s |
| Carousel (6 slides) | `deliverables/statics/carousel-1…6.png` | 1080 × 1350 |
| Feed post / Story | `deliverables/statics/feed-1x1.png`, `story-9x16.png` | 1080 × 1080, 1080 × 1920 |

---

## 1. What the audit found

### The product (physical source of truth)
- **TAP4.1 L-Stand**: one glossy PVC sheet bent into an L, ≈105 × 70 × 40 mm, rounded top corners, NFC inside, Tapfour print. Glossy Black and Glossy White (`products.csv`, `platform/src/lib.js` `PRODUCTS`).
- Three printed faces exist: *Google Review*, *Review + QR menu*, *Socials 4-in-1* (`lib.js` `DESIGNS`). The campaign uses the first two; 4-in-1 is left out on purpose.
- The film's stand is modelled from the supplied photos at real size: 70 mm wide, 105 mm tall, 40 mm deep, 3 mm sheet, 10° recline, eased edges, the exact print layout (title, lime ring + G, NFC mark, mono label, *Powered by tapfour*). The QR on the Connect face is a **real, scannable QR that opens `https://tap4.ph`**.
- **Not used:** `stand-acrylic*.jpg`, `stand-l*.jpg`, `stand-pvc*.jpg`, `stand-combo.jpg`, `card-*.jpg`, `bar-4tap.jpg`. They show transparent/illuminated acrylic, LED bases and retired products — exactly what the brief rules out.

### The software (what is actually shipped)
| Feature | Status in code | In the films? |
|---|---|---|
| Tap → `go.tap4.ph/t/<code>` → 302 (no-store) → Google review link | Built (`platform/src/index.js`, `lib.js resolve`) | Yes — the core demo |
| Paste a Google Maps link → review link | Built (`google.js`, `saveLinks`) | Implied ("programmed to your review page") |
| Edit destinations; "every stand updates on the next tap" | Built (`/app/destinations`) | Yes — real screen + real confirmation text |
| Live QR menu (hosted page, sold-out toggle, price edit) | Built (`modules.js`, `menuPage`) | Yes — real editor + real guest page |
| Owner dashboard: taps, QR scans, review opens, menu views, different people, busiest hours, what people opened, latest taps | Built (`ownerOverview`, `stats`) | Yes — real markup, sample data |
| Billing + inventory trackers ("Needs you" panel) | Built (Solo+) | Glimpse only |
| Branches, staff, monthly report | Built (Business/Empire) | No (not a launch story) |
| **Tap-to-join Wi-Fi**, "guests in now / avg stay / returning" | **Not built** (`/app/wifi` shows "SOON") | **No** |
| **Order from the table** | **Not built** | **No** |
| Review counts, ratings, review alerts | **Not built** (needs Google API) | **No** |

### Claim risks on the live site (worth fixing before paid media)
These appear on tap4.ph today and would contradict this campaign's guardrails:
1. Hero chips **"Higher ranking on Google Maps"** and **"Climb the map."** — ranking outcomes can't be promised (the map is marked *Illustration only*, but the headline isn't).
2. Live-taps ticker (`templates/index.json`): **"got a 5★ Google review"**, **"+12 Instagram followers"**, **"rating 4.4 → 4.8★"**, **"TikTok views up 3×"** — presented as live events; the platform can't measure any of these (`docs/TAP4_DASHBOARD_ARCHITECTURE.md` §7 says so too).
3. App section + Solo plan list **Tap-to-join Wi-Fi** and a dashboard showing **IN NOW 38 · AVG STAY 46m · RETURNING 41%** — not built.
4. `products.csv` describes the L-Stand as **"acrylic"**; the product is glossy **PVC**.
5. Naming collision: the 4-in-1 face is printed **"Connect with us"**, while the software product is **Tapfour Connect**. Consider renaming one before launch.

### Bugs found while capturing the real screens
- **Owner dashboard overflows on phones.** On `/app` (Home) the layout is 510 px wide on a 390 px screen, so cards are cut off. Cause: the mobile rule `.app { grid-template-columns: 1fr }` in `platform/src/views.js` lets wide children (tables, no-wrap link rows) stretch the column. Fix: `grid-template-columns: minmax(0, 1fr)`. The film applies this one-line fix to its snapshot so the dashboard looks as intended; the product itself is unchanged.
- **Demo data:** `platform/seed.sql` puts "busiest hours" at 1–3 AM and gives Kape Norte retired acrylic SKUs. The film uses a café-shaped day and TAP4.1 stands, labelled *Sample data*.

---

## 2. Strategy

**Audience.** Owners and managers of cafés and restaurants in the Philippines (prices in ₱, the demo café is in Maginhawa, QC). They decide fast, watch with sound off, and have been burned by "grow your business" tech.

**Insight.** Happy guests *would* leave a review — but finding the review page takes five steps on a phone, and the moment passes. The owner's problem isn't unhappy guests; it's friction.

**Proposition.** *Tapfour puts your Google review page one tap away, right on the table.* Then: *Tapfour Connect adds a live menu and a dashboard you run from your phone.*

**Story order** (follows the brief's hierarchy): physical product → customer action → immediate result → Connect → owner control → business value → CTA. The software is introduced only after the physical product has been understood, and it's introduced through the same stand.

**Tone.** Calm, exact, restaurant-warm. Sentence case, short lines, lime used as a signal (the ring, "one tap?", key words), never as glow. Black stand ≈ 85 % of product screen time; white appears once as the alternate finish.

### Claims guardrails (what the copy does and doesn't say)
| We say | Why it's true |
|---|---|
| "Your Google review page opens." | The tap 302-redirects to the business's review link. |
| "No app." | NFC/QR open a web link; guests install nothing. |
| "Nothing to charge. Passive NFC. No batteries, no Wi-Fi." | NFC tags are passive; the redirect uses the guest's own data. |
| "Arrives programmed to your Google review page." / "Programmed before it ships." | `products.csv`; checkout collects the Maps link and staff build the review link. |
| "Reviews still come from your guests. Tapfour just removes the searching." | Deliberate honesty line; no review is generated by a tap. |
| "Sold out? Tap once. Guests see it on their next look." | Sold-out toggle is real; the guest page is cached 15 s and doesn't live-push, so the film shows the guest page reloading. |
| "Every stand updates on the next tap." | Real product copy; redirects are 302 + no-store. |
| "Every tap and scan, counted." | Events are logged per tap/scan (bots and double-reads filtered). |

Never said: guaranteed reviews, rankings, #1 on Maps, follower growth, review counts, Wi-Fi, table ordering. The review form in the film is a **generic stand-in** (not Google's UI) and is captioned *Simulated screen*; dashboard numbers are captioned *Sample data*; the end card carries "Reviews are written by your guests."

---

## 3. Master script (80.8 s)

| Time | Picture | On screen | Sound |
|---|---|---|---|
| 0:00 | Evening café table, coffee in focus, the black stand soft behind | **Great meal.** / **No review.** | Warm pad, a soft thud on "No review." |
| 0:03 | Scene dims and blurs | *To leave you a Google review, a guest has to…* 01 Open Google Maps · 02 Search your restaurant · 03 Find the right listing · 04 Scroll to reviews · 05 Tap "Write a review" → all struck through. **That's a lot to ask of a happy guest.** | UI ticks per step, a swish on the strike |
| 0:07 | Still soft | **What if it took** / **one tap?** | Riser |
| 0:09 | Rack focus onto the stand, light glides across the gloss | **Tapfour Review** · NFC GOOGLE REVIEW STAND | Impact; the music begins on the tonic |
| 0:12 | High over-the-shoulder: the phone (screen on) dips onto the tap mark; NFC prompt drops in | **Guests tap their phone.** | Soft physical "thock" + two-note read chime; kick and bass enter on the tap |
| 0:16 | Phone close-up: prompt → `go.tap4.ph` → redirects → review page, five stars, a short review, Post | **Your Google review page opens.** · NO APP · NO SEARCHING · *Simulated screen* | Taps, star plucks, soft typing |
| 0:22 | Studio macro: corner and edge glint | **Glossy PVC.** Wipes clean. Fits any table or counter. | Whoosh |
| 0:24 | Oblique macro: the gloss, the bend and base | **Nothing to charge.** Passive NFC. No batteries, no Wi-Fi. | Whoosh |
| 0:26 | Frontal hero; 105 mm / 70 mm dimension lines draw on | **Arrives programmed to your Google review page.** → **Reviews still come from your guests. Tapfour just removes the searching.** | |
| 0:31 | Turntable swap: Review out, Connect in | **Need more than reviews?** → **Tapfour Connect** · REVIEW + LIVE QR MENU + DASHBOARD | Long whoosh; hats enter |
| 0:36 | The phone's camera frames the real QR (live render of the stand), link chip, tap → the real Kape Norte menu | **Tap to review. Scan for your menu.** → **A live menu, hosted for you.** | Focus blip, tap, swish |
| 0:42 | Owner's real menu editor + guest's real menu: *Mark sold out* → guest page reloads → SOLD OUT; Edit → ₱165 → ₱175 → Save → guest sees ₱175 | **Sold out?** Tap once. Guests see it on their next look. → **New price?** Change it in seconds. No reprint. · YOU / YOUR GUEST | Taps, typing, reload blips, success chimes |
| 0:51 | Real owner dashboard: today's tiles count up; busiest hours; Needs you; what people opened | **Every tap and scan, counted.** → **Busiest hours. Bills due. Low stock.** → **See what guests open most.** · *Sample data* | Soft count ticks |
| 0:59 | Real *My links*: change the Facebook link, Save → the product's real confirmation | **Change where your stand sends guests.** → **Every stand updates on the next tap.** | Typing, success chime |
| 1:04 | Both black stands on the café table, slow arc | TAPFOUR FOR RESTAURANTS ✓ Google reviews, one tap away ✓ A menu you can change anytime ✓ A dashboard that shows what works | Full arrangement |
| 1:11 | Studio: black and white Connect stands | **Glossy black or white.** | |
| 1:15 | Camera rises, stands settle low | tapfour (leaf mark grows) · Tapfour Review · Tapfour Connect · **Order at tap4.ph** · PROGRAMMED BEFORE IT SHIPS · legal line | Groove stops, bell chord, tail |

### Cut-downs (built from the same plates, re-timed copy and sound)
- **30 s** — hook → reveal → tap → review page → Connect → scan → sold out → dashboard → finishes → end card. One idea per beat.
- **15 s performance** — *Great meal. No review.* → *One tap.* → review page → *Plus a live menu you control.* → end card with CTA. Front-loads the product in the first 3 s.
- **LinkedIn 4:5 (55 s)** — the full story minus the macros and My links, with copy framed for owners/operators ("Built for restaurant owners", "No reprints. No PDF menus.", "One dashboard for the shop."). 4:5 plays larger in the LinkedIn feed; captions-first because autoplay is muted.

### Suggested captions
- **Instagram (master/30 s):** *Great meal. No review. Tapfour puts your Google review page one tap away — right on the table. Tapfour Connect adds a live menu you change from your phone and a dashboard that counts every tap. Glossy black or white, programmed before it ships. Order at tap4.ph*
- **LinkedIn:** *Most happy guests never leave a review — not because they didn't enjoy it, but because finding the review page takes five steps. Tapfour Review is an NFC stand that opens your Google review page in one tap. Tapfour Connect adds a live QR menu you update from your phone (sold out, new prices, no reprints) and a dashboard of taps, scans and busiest hours. Reviews still come from your guests; we just remove the searching. tap4.ph*

---

## 4. How it's made (and how to change it)

```
campaign/
  web/js/stand.js       the L-Stand: one bent PVC sheet, real dimensions, print as texture
  web/js/art.js         the printed faces (Review, Review + QR menu), real QR → https://tap4.ph
  web/js/world.js set.js  studio + evening café lighting, glossy tabletop, reflections, depth of field
  web/js/props.js       generic phone (no brand details), café cup
  web/shots/*.js        11 plates (picture only) + titles.js (copy layer)
  web/edits/*.js        master, reel30, reel15, linkedin: segments, copy cues, music + sound cues
  screens/              real pages captured from platform/ (capture-screens.mjs)
  score.py              original score + sound design, synthesized from each edit's cue sheet
```

Requirements: Node 22, Chromium (Playwright), Python 3 with numpy/scipy, the static ffmpeg from `imageio-ffmpeg`.

```bash
cd campaign && npm install && pip install numpy scipy pillow imageio-ffmpeg
# optional: re-capture the real screens (needs the local platform running on :8787)
node capture-screens.mjs && node capture-phone.mjs
node plates.mjs 9x16          # render picture plates (≈45 min on 4 CPUs, software WebGL)
node plates.mjs 4x5           # LinkedIn plates
node build.mjs master         # → deliverables/tapfour-master.mp4 (also reel30, reel15, linkedin)
node statics.mjs              # → deliverables/statics/*.png
node preview.mjs master 1.5,14.4,45   # quick composite stills for checking copy
```

- **Change copy or timing:** edit `web/edits/<edit>.js`, then `node build.mjs <edit>` (no 3D re-render; ~6 min).
- **Swap the music:** the score is original and synthesized so the films are clear to post. To use a licensed track, replace `out/<edit>.wav` and re-run the final step, or mute the score and keep the sound design (`sfx` cues).
- **Add a price end card:** prices are sale-driven (stand ₱899, Review + menu ₱1,398, Solo package ₱3,000 + ₱299/mo at the time of writing), so none are baked in. Add a `text` cue on the `end` segment.
- **Change the demo café:** Kape Norte is the fictional demo business used across tap4.ph and the platform seed.

## 5. Limits, and what would make it better
- **No people.** There is no real footage or hands; the phone is animated. A half-day live-action pickup (real café, a guest's hand tapping the black stand, the owner behind the counter marking an item sold out) would add warmth to the Reel and give the 15 s ad a human first frame. Shot list: hand-tap close-up at table height, over-the-shoulder QR scan, owner at the counter with the dashboard, a wide of stands on several tables.
- **The score is synthesized** and was checked by measurement (spectrum, −14 LUFS integrated, −1.5 dBTP), not by ear. Give it a listen before posting; replace with a licensed track if it isn't right for the brand.
- **Voiceover is optional.** Every film is understandable with sound off. If you want VO, the on-screen lines work as the script.
