#!/usr/bin/env bash
# still.sh <CompId> <frame> <out.png> [props-json]
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npx remotion still src/index.ts "$1" "$3" --frame="$2" --gl=swangle --browser-executable=$B --timeout=180000 ${4:+--props="$4"} 2>&1 | grep -v "^\s*$" | grep -E -A12 "An error|Rendered 1/1" | head -24
