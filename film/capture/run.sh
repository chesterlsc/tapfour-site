#!/usr/bin/env bash
# One shot: fresh local DB → local Worker → Playwright capture → stop the Worker. Local only.
set -euo pipefail
cd "$(dirname "$0")"
pkill -f "wrangler.*wrangler.film.toml" 2>/dev/null || true; sleep 1
./setup.sh > /dev/null
../../platform/node_modules/.bin/wrangler dev -c wrangler.film.toml --persist-to .state/d1 --port 8787 --ip 127.0.0.1 > .state/wrangler.log 2>&1 &
W=$!; trap 'kill $W 2>/dev/null; pkill -f "wrangler.*wrangler.film.toml" 2>/dev/null || true' EXIT
until curl -sf -o /dev/null http://127.0.0.1:8787/menu/kanto-coffee; do sleep 1; done
curl -s -D - -o /dev/null -A 'Mozilla/5.0 (Linux; Android 15) Mobile' http://127.0.0.1:8787/t/K4NT07 | grep -i '^location' | tee .state/redirect-review.txt
curl -s -D - -o /dev/null -A 'Mozilla/5.0 (Linux; Android 15) Mobile' http://127.0.0.1:8787/q/K4NT01/menu | grep -i '^location' | tee .state/redirect-menu.txt
node capture.mjs
