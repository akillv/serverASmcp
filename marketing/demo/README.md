# Workflow preview

This directory contains a 30-second animated workflow preview. It is a **simulated product walkthrough**, not a claim that a live VPS or public DNS request was used.

## Assets

| File | Purpose |
|---|---|
| `demo-workflow-preview.gif` | Repository-rendered preview for the README. |
| `demo-workflow-preview.mp4` | 1280×720 H.264 version for social upload or editing. |
| `workflow.html` | Frame source used to generate the preview. |

Current output:

- Duration: 30 seconds
- MP4: 1280×720, H.264, 450 frames at 15 fps playback
- GIF: 240 source frames at 8 fps playback

## Regenerate

From the repository root:

```bash
./scripts/render-demo-preview.sh
```

Requirements: Chromium, ImageMagick-compatible `identify`, and FFmpeg.

The renderer creates 60 labeled frames at two source frames per second, then exports a 15 fps MP4 and an 8 fps GIF.

## Replace with a live demo

This preview is intentionally labeled as simulated. Before a major launch, replace it with a real recording using:

1. A disposable VPS
2. A dedicated SSH key
3. A test domain and Cloudflare zone
4. The script in `marketing/demo-script-90-seconds.md`

Keep the live recording under 90 seconds and show the full trust boundary without exposing credentials.
