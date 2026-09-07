#!/usr/bin/env bash
# Render a store-asset HTML template to a PNG at exact pixel size.
# usage: render.sh <html> <width> <height> <out.png>
set -uo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HTML="$1"; W="$2"; H="$3"; OUT="$4"
DIR="$(cd "$(dirname "$0")" && pwd)"
PROFILE="$(mktemp -d)"
rm -f "$OUT"

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --user-data-dir="$PROFILE" \
  --window-size="${W},${H}" --virtual-time-budget=4000 \
  --screenshot="$OUT" "file://${DIR}/${HTML}" >/dev/null 2>&1 &
CHROME_PID=$!

for _ in $(seq 1 60); do
  [ -s "$OUT" ] && sleep 0.4 && break
  sleep 0.5
done
kill "$CHROME_PID" 2>/dev/null
wait "$CHROME_PID" 2>/dev/null
rm -rf "$PROFILE"

if [ ! -s "$OUT" ]; then echo "FAILED: $OUT" >&2; exit 1; fi
sips -g pixelWidth -g pixelHeight "$OUT" | tail -2 | tr '\n' ' '
echo "-> $(basename "$OUT")"
