# Chrome Web Store visual assets - September 2026

Uploaded to the live listing on 2026-09-07 (item `jbnaibigcohjfefpfocphcjeliohhold`,
publisher `d06aab50-8d15-47f5-9a09-a8c9a51d069a`). Store listing only - the extension
package (7.0.87) and all text fields were left untouched.

## Requirements this set was built against

Checked twice: the documentation and the dashboard's own field hints.

- https://developer.chrome.com/docs/webstore/images - screenshots "1280x800 or 640x400
  pixels", "at least 1 - and preferably the maximum allowed 5", small promo tile
  "440x280 pixels", marquee "1400x560 pixels".
- The dashboard's Graphic assets section states verbatim: Screenshots "Up to a maximum
  of 5 / 1280x800 or 640x400 / JPEG or 24-bit PNG (no alpha) / At least one is required";
  Small promo tile "440x280 Canvas"; Marquee promo tile "1400x560 Canvas".
- There is no 920x680 large-tile slot in the dashboard any more, so
  `../promo/large-tile-920x680.png` is obsolete and was not replaced.

All files below are 24-bit PNG, no alpha channel, exact pixel dimensions.

## Uploaded files

| Slot | File | Size |
|------|------|------|
| Screenshot 1 | `screenshots/01-brand-secret-sauce-1280x800.png` | 1280x800 |
| Screenshot 2 | `screenshots/02-guardian-full-1280x800.png` | 1280x800 |
| Screenshot 3 | `screenshots/03-wikipedia-full-1280x800.png` | 1280x800 |
| Screenshot 4 | `screenshots/04-guardian-detail-1280x800.png` | 1280x800 |
| Screenshot 5 | `screenshots/05-wikipedia-detail-1280x800.png` | 1280x800 |
| Small promo tile | `promo/small-tile-440x280.png` | 440x280 |
| Marquee promo tile | `promo/marquee-1400x560.png` | 1400x560 |

Store icon was not touched.

## Source material

`originals/` holds untouched copies of the three source files:

- `seo-live-test-hero.jpg` - promotional design reference (dark navy, electric blue,
  "MY SEO SECRET SAUCE." / "120+ CHECKS. FREE.")
- `seo-live-test-guardian.png` - real 3112x2120 screenshot, extension analysing
  theguardian.com/film/2026/aug/12/x-men-spider-man-marvel, run at 07.09.2026 21:57
- `seo-live-test-wikipedia.png` - real 3112x2120 screenshot, extension analysing
  en.wikipedia.org/wiki/Spider-Man:_Brand_New_Day, run at 07.09.2026 21:55

## How the derived assets were made

No generative AI touched the screenshots. Every pixel of the interface, the page
content, the counters and the version label comes from the two originals - the only
operations were crop and proportional Lanczos resize, then placement on the hero's
navy background.

- Browser window bounds inside both originals: `(112, 76) - (3000, 1972)`, i.e.
  2888x1896, aspect 1.523.
- Full-window entries (2, 3): window scaled proportionally to 1219x800 and centred on
  1280x800; the 30px left/right margin is background, nothing is stretched or cropped.
- Detail entries (4, 5): crop `x 1332-2999, y 400-1343` (1667x943, aspect 1.768) scaled
  to 1160x656 and placed under a caption strip. The crop starts at the page's column
  gutter, keeps the whole results panel, and shows the tested page beside it.
- Brand card (1) and both promo tiles: hero-style layout (navy gradient, diagonal blue
  beam, `#0248FD` chip sampled from the hero) with the real window and panel crops.

Colours sampled from the hero: background `#02081A`, chip/beam `#0248FD`.

Facts stated in the captions come from the screenshots themselves:
theguardian.com 0 failed / 5 warn / 77 info / 37 ok, en.wikipedia.org 1 failed
("No meta description found.") / 10 warn / 79 info / 29 ok.

## Rebuilding

```bash
cd v7/marketing/store-2026-09/build
./render.sh 01-brand.html 1280 800 ../screenshots/01-brand-secret-sauce-1280x800.png
```

`build/` holds the HTML templates, `base.css` (the design system) and `img/` (the
pre-resized crops). `work/` holds render scratch and dashboard verification
screenshots and can be deleted.
