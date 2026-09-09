# Chrome Web Store Submission Guide

**Currently published:** 7.0.111 - approved and live, 609 users
**In review:** 7.0.117 submitted September 9, 2026 - fixes the session-storage quota
exhaustion that broke Run test (orphan run records grown from post-run subresource
traffic). "Publish automatically after it has passed review" was left checked.

Upload flow that works, fully scriptable: the `google-team-login` skill (agent-browser
+ `~/.agent-browser-google-team-profile/auth-state.json`). If the saved state has gone
stale the account chooser appears; clicking the team account and entering the password
was enough - no 2FA prompt. Then Package tab -> "Upload new package" ->
`agent-browser upload "input[type=file]" v7/zip-build/latest-build.zip` -> item edit
page -> "Submit for review" -> "Submit For Review".

To replace a submission that is still pending review: the item page's overflow
menu (the three dots beside "Submit for review") has **Cancel review**, which
returns the item to draft and re-enables both "Upload new package" and "Submit
for review". It is not on the Status page or the Package tab, which is why it
looks at first as though a pending submission cannot be withdrawn.

**Last updated:** September 9, 2026

## Files to Upload

### Extension Package
```
v7/zip-build/latest-build.zip
```

### Images
Current set: `v7/marketing/store-2026-09/` (September 2026). The older
`v7/marketing/screenshots/` + `v7/marketing/promo/` set is superseded.

| Asset | Path |
|-------|------|
| Icon 128x128 | `v7/src/icons/icon-128.png` |
| Screenshot 1 | `v7/marketing/store-2026-09/screenshots/01-brand-secret-sauce-1280x800.png` |
| Screenshot 2 | `v7/marketing/store-2026-09/screenshots/02-guardian-full-1280x800.png` |
| Screenshot 3 | `v7/marketing/store-2026-09/screenshots/03-wikipedia-full-1280x800.png` |
| Screenshot 4 | `v7/marketing/store-2026-09/screenshots/04-guardian-detail-1280x800.png` |
| Screenshot 5 | `v7/marketing/store-2026-09/screenshots/05-wikipedia-detail-1280x800.png` |
| Small tile 440x280 | `v7/marketing/store-2026-09/promo/small-tile-440x280.png` |
| Marquee 1400x560 | `v7/marketing/store-2026-09/promo/marquee-1400x560.png` |

The dashboard no longer offers a 920x680 large promo tile slot; that asset is obsolete.

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
