#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/marketing/demo"
FRAMES="$OUT/.frames"
HTML="$OUT/workflow.html"
FPS="${FPS:-2}"
TOTAL="${TOTAL:-60}"
mkdir -p "$FRAMES" "$OUT"
rm -f "$FRAMES"/*.png

for ((frame=1; frame<=TOTAL; frame++)); do
  printf -v number '%03d' "$frame"
  chromium \
    --headless=new \
    --no-sandbox \
    --disable-gpu \
    --hide-scrollbars \
    --force-device-scale-factor=1 \
    --window-size=1280,720 \
    --screenshot="$FRAMES/$number.png" \
    "file://$HTML?frame=$frame" >/dev/null 2>&1
done

ffmpeg -y -hide_banner -loglevel error \
  -framerate "$FPS" -i "$FRAMES/%03d.png" \
  -vf "fps=15,format=yuv420p" \
  -c:v libx264 -preset veryfast -crf 27 -movflags +faststart \
  "$OUT/demo-workflow-preview.mp4"

# Animated repository-preview fallback for Markdown embedding.
ffmpeg -y -hide_banner -loglevel error \
  -framerate "$FPS" -i "$FRAMES/%03d.png" \
  -vf "fps=8,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer" \
  -loop 0 "$OUT/demo-workflow-preview.gif"

rm -rf "$FRAMES"
printf 'Created %s and %s\n' "$OUT/demo-workflow-preview.mp4" "$OUT/demo-workflow-preview.gif"
