#!/bin/bash
# Wait until a file contains a line matching a pattern: wait-line.sh <file> <pattern> [timeout_s]
f="$1"; pat="$2"; t="${3:-900}"; s=0
until grep -q -- "$pat" "$f" 2>/dev/null; do sleep 3; s=$((s+3)); [ $s -ge $t ] && { echo "timeout"; exit 1; }; done
grep -- "$pat" "$f"
