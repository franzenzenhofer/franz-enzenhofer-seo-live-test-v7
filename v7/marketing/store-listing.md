# Chrome Web Store Listing - SEO Live Test v7

## Basic Information

**Extension Name:** Franz Enzenhofer SEO Live Test
**Short Name:** SEO Live Test
**Version:** 0.1.893

---

## Short Description (max 132 characters)

```
Real-time SEO analysis in your browser side panel. 100+ rules for meta tags, headings, links, schema, and performance.
```
(120 characters)

---

## Detailed Description (max 16,000 characters)

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
4. Click any result to highlight it on the page
5. (Optional) Connect Google Search Console for additional data

KEYBOARD SHORTCUTS

- Ctrl+Shift+L (Windows/Linux) or Cmd+Shift+L (Mac): Open side panel
- Configure custom shortcuts in chrome://extensions/shortcuts

SUPPORT

For bug reports and feature requests, visit our GitHub repository.

Made with care by Franz Enzenhofer.
```

---

## Category

**Primary Category:** Developer Tools
**Additional Category:** Productivity (if allowed)

---

## Language

**Primary Language:** English

---

## Search Keywords (for internal reference)

- SEO checker
- SEO audit
- meta tag analyzer
- page analyzer
- SEO tool
- website analyzer
- on-page SEO
- technical SEO

---

## Privacy Policy URL

Required if using `identity` permission:
```
https://seo-live-test.franzai.com/privacy.html
```

**Alternative URL:** `https://seo-live-test.pages.dev/privacy.html`

**Privacy Policy Text:**

```
Privacy Policy for SEO Live Test Chrome Extension

Last updated: January 2026

OVERVIEW
SEO Live Test is a browser extension that analyzes web pages for SEO issues. This policy explains how we handle your data.

DATA COLLECTION
- We do NOT collect any personal information
- We do NOT track your browsing history
- We do NOT send your data to external servers
- All SEO analysis runs entirely in your browser

GOOGLE API ACCESS
If you choose to connect Google Search Console or Analytics:
- We request read-only access to your data
- Data is fetched directly from Google to your browser
- We do not store, transmit, or share this data
- You can disconnect at any time in extension settings

LOCAL STORAGE
The extension stores:
- Your preferences (enabled rules, display settings)
- Cached analysis results for the current session
This data stays in your browser and is never transmitted.

PERMISSIONS EXPLAINED
- sidePanel: Display results in Chrome's side panel
- tabs: Detect when you navigate to new pages
- scripting: Inject content scripts for DOM analysis
- storage: Save your preferences locally
- webRequest: Analyze HTTP headers and responses
- identity: Optional Google account connection

CONTACT
For questions about this policy, open an issue on GitHub.
```

---

## Single Purpose Description (for Chrome Web Store review)

```
This extension analyzes web pages for SEO issues and displays the results in a side panel. Users can see meta tag analysis, heading structure, link audits, and other SEO checks in real-time as they browse.
```

---

## Permissions Justification (for Chrome Web Store review)

| Permission | Justification |
|------------|---------------|
| sidePanel | Core UI - displays all SEO analysis results |
| offscreen | Sandboxed rule execution for security |
| storage | Saves user preferences and rule settings |
| unlimitedStorage | Caches analysis results for run history |
| tabs | Detects navigation to trigger new analysis |
| scripting | Injects content script for DOM inspection |
| activeTab | Highlights elements when user clicks results |
| webRequest | Analyzes HTTP response headers |
| webNavigation | Tracks navigation events for analysis timing |
| identity | Optional Google Search Console OAuth |
| alarms | Schedules background tasks (cleanup, cache) |
| contextMenus | Right-click menu for quick actions |
| host_permissions: <all_urls> | Analyzes any webpage the user visits |

---

## Store Assets Checklist

### Icons
- [x] 128x128 icon (src/icons/icon-128.png)

### Promotional Images
- [x] Small tile: 440x280 (marketing/promo/small-tile-440x280.png)
- [x] Large tile: 920x680 (marketing/promo/large-tile-920x680.png)
- [x] Marquee: 1400x560 (marketing/promo/marquee-1400x560.png)

### Screenshots (1280x800)
- [x] Screenshot 1: Side panel with results (marketing/screenshots/screenshot-1-sidepanel.png)
- [x] Screenshot 2: Feature overview (marketing/screenshots/screenshot-2-features.png)
- [x] Screenshot 3: Settings page (marketing/screenshots/screenshot-3-settings.png)

---

## Submission Notes

1. Extension uses Manifest V3 (required)
2. All permissions are actively used in codebase (verified)
3. OAuth client ID is registered for Chrome Web Store
4. Extension key in manifest matches published extension ID
