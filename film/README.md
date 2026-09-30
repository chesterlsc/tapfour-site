# Tapfour Connect: launch film

A 90-second launch film for Tapfour Connect (tap4.ph), aimed at café and restaurant owners in the Philippines. It is built in Remotion (React/TS). Every stand on screen is one of the supplied product renders; there is no generated 3D.

| Deliverable | File |
|---|---|
| Film, 1920×1080, 30 fps, H.264 yuv420p CRF 18, AAC | `out/tapfour-connect-1080p30.mp4` |
| Audio stem (48 kHz / 24-bit WAV) | `out/tapfour-connect-audio.wav` |
| Storyboard (one labelled frame per shot) | `out/storyboard.png` |
| Plan: shot list, asset map, gaps, built-for-film list | `PLAN.md` |
| Pitch copy: master tagline, 3 alternates, product line | `PITCH.md` |

How to rebuild, and how to render the same edit at 4K with `--scale 2`, is covered in PLAN.md under "Build, in order".

## Which screens are real and which were built for the film

**Real repo UI.** These run from `platform/` locally with the fictional Kanto Coffee seed, and were captured with Playwright at 3× device scale.

| Screen | Where it appears | Source |
|---|---|---|
| Tap redirect | Shot 3, browser bar | `GET /t/K4NT07` → `302 https://g.page/r/kanto-coffee-example/review` (`platform/src/index.js:48`) |
| QR redirect | Shot 4 | `GET /q/K4NT01/menu` → `/menu/kanto-coffee?d=K4NT01` |
| Live QR menu, before and after the owner's edits | Shot 4 | `/menu/kanto-coffee` (`views.js` `menuPage`). The "Sold out" and ₱190 → ₱175 changes were made through the real `/app/menu` routes before capture. |
| Menu page as the base of the ordering screen | Shot 5 | `/menu/kanto-coffee`. The layout, items, prices and sold-out state are real. |
| Owner dashboard: counts, busiest hours, what guests opened | Shot 6 | `/app` (`views.js` `ownerOverview`). The page itself is real; only the count-up is driven frame by frame. |
| Owner app shell (sidebar, cards, tiles) | Shot 5 counter tablet | `/app` layout and `base.css` components |
| Business page ("website") | Shot 7 | `/p/kanto-coffee` (`views.js` `linksPage`) |
| Menu setup: paste a whole menu, items added | Shot 7 | `/app/menu`, "Paste many at once" and "Add these items" (real `POST /app/menu/import`) |

**Built for the film.** These screens are not in the repo. Each is made from the repo's own tokens and components.

- **Guest table ordering.** The real menu page plus +/- steppers, a cart bar reading "Place order · Table 7", and "Order received" → "Preparing". The platform has no ordering routes yet (`views.js:1114`).
- **Counter tablet "Orders" view.** Uses the "New order · Table 7 · 3 items" notification, the order card and "Accept · send to kitchen" (wording from the site demo in `assets/theme.js`).
- **Google "write a review" sheet** for Kanto Coffee, with a fictional guest.
- **Google Business Profile, before and after.**
- **Generic phone chrome.** Lock screen, NFC tag banner, browser bar and camera viewfinder UI (the viewfinder image is the supplied white Review + Menu render).

**One change to real UI:** "POWERED BY tapfour" on the public pages gets the leaf mark in front of it, so the lockup is never the wordmark alone.
