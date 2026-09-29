#!/usr/bin/env bash
# Local-only: fresh D1 state for the film, then the platform Worker on :8787. Never uses --remote.
set -euo pipefail
cd "$(dirname "$0")"
W=../../platform/node_modules/.bin/wrangler
rm -rf .state && mkdir -p .state
node seed.mjs
$W d1 migrations apply tapfour-film --local -c wrangler.film.toml --persist-to .state/d1 <<<'y'
$W d1 execute tapfour-film --local -c wrangler.film.toml --persist-to .state/d1 --file .state/seed-film.sql
