# Chrome Web Store Submission Guide

**Latest submission:** 7.0.57 (2026-09-01) - status: pending review, auto-publish on approval
**Supersedes:** 7.0.55, uploaded earlier the same day and replaced before review completed
**Currently published:** 7.0.38 (561 users)
**Last updated:** September 1, 2026

## Files to Upload

### Extension Package
```
v7/zip-build/latest-build.zip
```

### Images
| Asset | Path |
|-------|------|
| Icon 128x128 | `v7/src/icons/icon-128.png` |
| Screenshot 1 | `v7/marketing/screenshots/screenshot-1-sidepanel.png` |
| Screenshot 2 | `v7/marketing/screenshots/screenshot-2-settings.png` |
| Screenshot 3 | `v7/marketing/screenshots/screenshot-3-features.png` |
| Small tile 440x280 | `v7/marketing/promo/small-tile-440x280.png` |
| Large tile 920x680 | `v7/marketing/promo/large-tile-920x680.png` |
| Marquee 1400x560 | `v7/marketing/promo/marquee-1400x560.png` |

## Store Listing Content

### Short Description (120 chars)
```
Real-time SEO analysis in your browser side panel. 100+ rules for meta tags, headings, links, schema, and performance.
```

### Detailed Description
```
SEO Live Test is a professional Chrome extension that analyzes web pages for SEO issues in real-time. Results appear instantly in a side panel as you browse - no manual audits needed.

KEY FEATURES

100+ SEO Rules
Comprehensive checks covering:
- Meta tags (title, description, robots, canonical)
- Headings (H1-H6 structure and hierarchy)
- Images (alt text, dimensions, lazy loading)
- Links (internal, external, broken, nofollow)
- Schema.org structured data
- Open Graph and Twitter Cards
- Core Web Vitals indicators
- Security (HTTPS, mixed content)
- Indexability (robots.txt, meta robots)

Real-Time Analysis
Results update automatically as you navigate. The side panel shows:
- Pass/Warning/Error counts at a glance
- Detailed findings for each rule
- HTML snippets and DOM paths for debugging
- Priority-based filtering

Google Integration
Connect to Google Search Console and PageSpeed Insights:
- View real search performance data for the current URL
- See PageSpeed scores alongside SEO results
- One-click authentication via Google OAuth

Developer-Friendly
- DOM highlighting: Click any result to highlight the element on the page
- Export reports in multiple formats
- Full keyboard shortcuts support (Ctrl+Shift+L to open)
- Dark theme optimized for long sessions

Built for Modern Chrome
- Manifest V3 compliant
- Side panel interface (no popups)
- Lightweight background service worker
- No impact on page performance

WHO IT'S FOR
- SEO professionals auditing client websites
- Web developers checking their work before deployment
- Content creators ensuring posts are optimized
- QA engineers verifying SEO requirements
- Anyone who wants to understand how search engines see their pages

PRIVACY
- All analysis runs locally in your browser
- No data is sent to external servers (except optional Google API connections you enable)
- No tracking or analytics
- Open source rule definitions

GETTING STARTED
1. Click the extension icon to open the side panel
2. Browse to any webpage
3. See instant SEO analysis results
4. Click on any result to see details
5. (Optional) Connect Google Search Console for additional data

KEYBOARD SHORTCUTS
- Ctrl+Shift+L (Windows/Linux) or Cmd+Shift+L (Mac): Open side panel
- Configure custom shortcuts in chrome://extensions/shortcuts

SUPPORT
For bug reports and feature requests, visit our GitHub repository.

Made with care by Franz Enzenhofer.
```

## Settings

| Setting | Value |
|---------|-------|
| Category | Developer Tools |
| Language | English |
| Privacy Policy | https://seo-live-test.franzai.com/privacy.html |
| Homepage | https://seo-live-test.franzai.com |

## Developer Console URL
```
https://chrome.google.com/u/1/webstore/devconsole/d06aab50-8d15-47f5-9a09-a8c9a51d069a
```

## Quick Commands

```bash
# Rebuild if needed
cd v7 && npm run dist

# Zip file location
open v7/zip-build/
```
