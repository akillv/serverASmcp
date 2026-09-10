# GitHub social preview

`social-preview.svg` is the source design.

GitHub requires PNG or JPG for the uploaded social preview. Render and upload it at exactly 1280×640:

```bash
# Choose one local renderer:
rsvg-convert --width 1280 --height 640 social-preview.svg --output social-preview.png
# or
magick social-preview.svg -resize 1280x640 social-preview.png
```

Upload `social-preview.png` at:

```text
https://github.com/akillv/serverASmcp/settings/social-preview
```
