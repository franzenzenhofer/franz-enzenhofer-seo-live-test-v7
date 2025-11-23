# Marketing Assets for F19N SEO Live Test

This directory contains all assets required for Chrome Web Store submission.

## Directory Structure

```
marketing/
├── icons/                      # Extension icons (all sizes)
│   ├── icon.svg               # Source SVG (editable)
│   ├── icon-16.png            # 16x16 toolbar icon
│   ├── icon-32.png            # 32x32 toolbar icon
│   ├── icon-48.png            # 48x48 extensions page
│   ├── icon-128.png           # 128x128 Chrome Web Store
│   ├── store-icon.svg         # Store icon source (with padding)
│   └── store-icon-128.png     # 128x128 with 16px padding (REQUIRED)
│
├── promo/                      # Promotional images
│   ├── small-tile.svg         # Source SVG
│   ├── small-tile-440x280.png # 440x280 small tile (REQUIRED)
│   ├── large-tile.svg         # Source SVG
│   ├── large-tile-920x680.png # 920x680 large tile (OPTIONAL)
│   ├── marquee.svg            # Source SVG
│   └── marquee-1400x560.png   # 1400x560 marquee (OPTIONAL)
│
├── screenshots/                # Store listing screenshots
│   ├── screenshot-1-overview-v2.svg        # Source SVG
│   ├── screenshot-1-overview.png           # 1280x800 main interface
│   ├── screenshot-2-features-v2.svg        # Source SVG
│   ├── screenshot-2-features.png           # 1280x800 features
│   ├── screenshot-3-integration-v2.svg     # Source SVG
│   └── screenshot-3-integration.png        # 1280x800 Google integration
│
├── CHROME-WEB-STORE-SUBMISSION.md  # Complete submission guide
└── README.md                        # This file
```

## Asset Specifications

### Icons (Required)

| File | Size | Format | Purpose | Status |
|------|------|--------|---------|--------|
| `icon-16.png` | 16x16 | PNG | Toolbar icon (small) | ✅ |
| `icon-32.png` | 32x32 | PNG | Toolbar icon (medium) | ✅ |
| `icon-48.png` | 48x48 | PNG | Extensions page | ✅ |
| `icon-128.png` | 128x128 | PNG | Chrome Web Store | ✅ |
| `store-icon-128.png` | 128x128 | PNG | Store with padding | ✅ |

**Note:** `store-icon-128.png` has 16px transparent padding around a 96x96 icon (Chrome Web Store requirement).

### Promotional Images

| File | Size | Format | Purpose | Required | Status |
|------|------|--------|---------|----------|--------|
| `small-tile-440x280.png` | 440x280 | PNG | Small tile | YES | ✅ |
| `large-tile-920x680.png` | 920x680 | PNG | Large tile | Optional | ✅ |
| `marquee-1400x560.png` | 1400x560 | PNG | Marquee featured | Optional | ✅ |

### Screenshots (1-5 required)

| File | Size | Format | Description | Status |
|------|------|--------|-------------|--------|
| `screenshot-1-overview.png` | 1280x800 | PNG | Main interface with side panel | ✅ |
| `screenshot-2-features.png` | 1280x800 | PNG | Feature categories overview | ✅ |
| `screenshot-3-integration.png` | 1280x800 | PNG | Google integration capabilities | ✅ |

**Upload Order:** 1 → 2 → 3 (this is the order they appear in the store)

## Design Notes

### Color Palette

- **Primary Blue:** `#1a73e8` (Google Blue)
- **Success Green:** `#34a853` (Google Green)
- **Warning Yellow:** `#fbbc04` (Google Yellow)
- **Error Red:** `#ea4335` (Google Red)
- **Background:** `#f8f9fa` (Light gray)
- **Text:** `#202124` (Dark gray)
- **Secondary:** `#5f6368` (Medium gray)

### Typography

- **Font Family:** Arial, sans-serif (safe, universal)
- **Headings:** Bold weight, 24-48px
- **Body:** Regular weight, 13-16px
- **Captions:** Regular weight, 11-13px

### Icon Design

The extension icon features:
- **Magnifying glass:** Represents analysis/inspection
- **Code brackets `{}`:** Represents technical/SEO analysis
- **Dots:** Represent data/code elements
- **Checkmark badge:** Represents validation/success
- **Blue-green gradient:** Modern, professional, trustworthy

## Updating Assets

### To Regenerate Icons

```bash
cd /Users/franzenzenhofer/dev/franz-enzenhofer-seo-live-test-v7/marketing/icons

# From SVG sources
rsvg-convert -w 16 -h 16 icon.svg -o icon-16.png
rsvg-convert -w 32 -h 32 icon.svg -o icon-32.png
rsvg-convert -w 48 -h 48 icon.svg -o icon-48.png
rsvg-convert -w 128 -h 128 icon.svg -o icon-128.png
rsvg-convert -w 128 -h 128 store-icon.svg -o store-icon-128.png
```

### To Regenerate Promotional Images

```bash
cd /Users/franzenzenhofer/dev/franz-enzenhofer-seo-live-test-v7/marketing/promo

rsvg-convert -w 440 -h 280 small-tile.svg -o small-tile-440x280.png
rsvg-convert -w 920 -h 680 large-tile.svg -o large-tile-920x680.png
rsvg-convert -w 1400 -h 560 marquee.svg -o marquee-1400x560.png
```

### To Regenerate Screenshots

```bash
cd /Users/franzenzenhofer/dev/franz-enzenhofer-seo-live-test-v7/marketing/screenshots

rsvg-convert -w 1280 -h 800 screenshot-1-overview-v2.svg -o screenshot-1-overview.png
rsvg-convert -w 1280 -h 800 screenshot-2-features-v2.svg -o screenshot-2-features.png
rsvg-convert -w 1280 -h 800 screenshot-3-integration-v2.svg -o screenshot-3-integration.png
```

## Chrome Web Store Requirements

### Image Size Limits
- Maximum file size: 2MB per image
- Recommended formats: PNG (for quality), JPG (for photos)
- Our assets: All PNG, well under 2MB limit

### Quality Guidelines
- ✅ High resolution (all assets use recommended sizes)
- ✅ Clear, professional design
- ✅ Accurate representation of extension
- ✅ No misleading screenshots
- ✅ Proper branding and consistency

### Common Rejection Reasons (We Avoid)
- ❌ Low resolution images → ✅ We use recommended high-res sizes
- ❌ Misleading screenshots → ✅ Accurate representation of actual UI
- ❌ Poor quality → ✅ Professional vector-based designs
- ❌ Wrong dimensions → ✅ Exact required dimensions
- ❌ Excessive text in tiles → ✅ Balanced image/text ratio

## File Sizes

Current asset file sizes:

### Icons
- `icon-16.png`: ~600 bytes
- `icon-32.png`: ~1.3 KB
- `icon-48.png`: ~2.1 KB
- `icon-128.png`: ~6.3 KB
- `store-icon-128.png`: ~5.1 KB

**Total icons:** ~15.4 KB

### Promotional
- `small-tile-440x280.png`: ~42 KB
- `large-tile-920x680.png`: ~113 KB
- `marquee-1400x560.png`: ~85 KB

**Total promo:** ~240 KB

### Screenshots
- `screenshot-1-overview.png`: ~75 KB
- `screenshot-2-features.png`: ~118 KB
- `screenshot-3-integration.png`: ~155 KB

**Total screenshots:** ~348 KB

**Total all assets:** ~603 KB (well under 2MB limit per file ✅)

## Next Steps

1. **Review all assets:**
   - [ ] Open each PNG file and verify quality
   - [ ] Check that icons are clear at all sizes
   - [ ] Verify screenshots accurately represent the extension
   - [ ] Confirm promotional tile is attractive and informative

2. **Copy to extension:**
   ```bash
   # Copy icons to extension dist folder
   cp icons/icon-*.png ../v7/dist/icons/
   ```

3. **Prepare submission package:**
   - [ ] Read `CHROME-WEB-STORE-SUBMISSION.md`
   - [ ] Prepare developer account
   - [ ] Build final extension: `cd ../v7 && npm run dist`
   - [ ] Upload `v7/dist.zip` to Chrome Web Store
   - [ ] Upload all marketing assets from this folder

4. **Submit:**
   - [ ] Follow step-by-step guide in `CHROME-WEB-STORE-SUBMISSION.md`
   - [ ] Use provided description and permission justifications
   - [ ] Submit for review

## Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- [Image Requirements](https://developer.chrome.com/docs/webstore/images)
- [Branding Guidelines](https://developer.chrome.com/docs/webstore/branding)
- [Store Listing Best Practices](https://developer.chrome.com/docs/webstore/best-listing)

---

**Created:** 2025-11-23
**Last Updated:** 2025-11-23
**Status:** Ready for submission ✅
