# F19N SEO Live Test

A comprehensive SEO testing Chrome extension that analyzes web pages in real-time with 100+ rules covering technical SEO, performance, accessibility, and Google integrations.

## Features

- **100+ SEO Rules** - Title, meta tags, canonical, Open Graph, Schema.org, images, links, security headers
- **Real-time Analysis** - Results update as you browse
- **Google Integration** - PageSpeed Insights scores, Search Console data (with auth)
- **Export Reports** - HTML and JSON export for sharing
- **Side Panel UI** - Non-intrusive Chrome DevTools-style interface

## Installation (Developer Mode)

### 1. Clone and Build

```bash
git clone https://github.com/franzenzenhofer/franz-enzenhofer-seo-live-test-v7.git
cd franz-enzenhofer-seo-live-test-v7/v7
npm install
npm run build
```

### 2. Load in Chrome

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Select the `v7/dist` folder

### 3. Use It

1. Navigate to any website
2. Click the extension icon in the toolbar
3. View SEO analysis in the side panel

## Rule Categories

| Category | Description |
|----------|-------------|
| HEAD | Title, meta description, canonical, robots, viewport |
| Open Graph | og:title, og:description, og:image, og:url |
| Schema.org | Article, Breadcrumb, FAQ, Product, Recipe, Video, etc. |
| HTTP | Status codes, redirects, HSTS, security headers, gzip |
| BODY | H1, images, internal links, nofollow |
| SPEED | Preload, preconnect, DNS prefetch, blocking scripts |
| Google | PageSpeed Insights, Search Console, Mobile Friendly |
| DISCOVER | Google Discover eligibility checks |

## Optional: API Configuration

### PageSpeed Insights
Works out of the box with a default API key. For heavy usage, get your own free key:
https://developers.google.com/speed/docs/insights/v5/get-started

### Google Search Console
1. Open extension Settings (gear icon)
2. Click "Sign In" under Google Account
3. Authorize with your Google account that has Search Console access

## Development

```bash
cd v7

# Development with hot reload
npm run dev

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint

# Full build
npm run build
```

## Tech Stack

- Chrome Extension Manifest V3
- React 18 + TypeScript
- Vite build system
- Tailwind CSS
- Vitest for testing

## License

See [LICENSE.txt](LICENSE.txt)

## Author

Franz Enzenhofer - [fullstackoptimization.com](https://fullstackoptimization.com)
