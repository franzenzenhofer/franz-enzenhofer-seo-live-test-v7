# Rules System Verification Report

**Date**: 2025-11-15
**Status**: ✅ ALL VERIFIED
**Total Rules**: 100

---

## Verification Summary

All **100 rules** are properly registered, configured, and ready to execute!

### ✓ Registry Verification
- **100 rules** imported in `v7/src/rules/registry.ts`
- **100 rules** exported in registry array
- All imports compile without errors
- No duplicate rule IDs

### ✓ Inventory Verification
- **100 rules** in `v7/rules.inventory.json`
- All rules have required fields: `id`, `name`, `enabledByDefault`, `what`
- Inventory matches registry perfectly (no missing or extra rules)

### ✓ Type Safety Verification
- All rules have `id: string`
- All rules have `name: string`
- All rules have `enabled: boolean`
- All rules have `what: string` (test type)
- All rules have `run: (page, ctx) => Promise<Result|Result[]>`

### ✓ Build Verification
- TypeScript compilation: **0 errors**
- ESLint: **0 violations**
- Build successful: **✓**
- Version bumped to: **0.1.337**

---

## Rules Breakdown by Type

### 🔵 STATIC (70 rules) - Tests Static DOM

Tests initial/static HTML DOM elements:

**HEAD Section (21 rules)**
- Title, Meta Description, Meta Charset, Meta Viewport, Meta Keywords
- Canonical Link (+ variations: absolute, self, chain, redirects)
- Robots Meta, Googlebot Meta, Robots Noindex
- Hreflang, Hreflang Multipage
- Brand in Title, Title Length
- Shortlink, AMP HTML, Twitter Card
- rel=alternate media

**Open Graph (4 rules)**
- OG Title, OG Description, OG Image, OG URL

**Schema.org Structured Data (11 rules)**
- Article (present, required fields)
- BreadcrumbList, Event, FAQPage, HowTo
- JobPosting, Organization/LocalBusiness
- Product, Recipe, VideoObject

**Google Discover (10 rules)**
- Article Structured Data, Author Present
- Canonical OK, Headline Length
- Indexable, Large OG Image
- Max Image Preview Large, Primary Language
- Published Time, Twitter Large Card

**Body Content (7 rules)**
- H1 Present, Images Layout, Images Lazy Loading
- Internal Links Count, Nofollow Links
- Links with Query Params, Unsecure Input over HTTP

**Accessibility (2 rules)**
- Linked Images need alt
- Linked images without alt and text

**DOM Analysis (6 rules)**
- Client-side rendering heuristic
- DOM node count, DOM node depth
- HTML lang attribute
- LD+JSON presence
- Top words

**Speed Optimization (4 rules)**
- Blocking scripts in head
- rel=dns-prefetch, rel=preconnect, rel=preload

**URL (2 rules)**
- History state update detected
- URL trailing slash consistency

**Google Services (2 rules)**
- AMP Cache URL
- Google auth connected

**Debug (1 rule)**
- Page summary (disabled by default)

---

### 🟠 HTTP (22 rules) - Tests HTTP Headers/Response

Tests HTTP protocol, headers, and responses:

**robots.txt (4 rules)**
- robots.txt Exists
- robots.txt blocked resources
- robots.txt complexity
- robots.txt Sitemap reference
- Googlebot URL allowed

**HTTP Protocol (6 rules)**
- HTTP Status (200, 404, 500, etc.)
- HTTPS Scheme
- HTTP/2 Advertised (Alt-Svc)
- HTTP/3 Advertised (Alt-Svc)
- Alt-Svc other protocols
- Gzip/Brotli compression

**HTTP Headers (12 rules)**
- HTTP has header (configurable)
- Link Header
- Vary: User-Agent
- Strict-Transport-Security (HSTS)
- Security headers presence
- X-Robots-Tag
- X-Robots unavailable_after
- X-Cache hit/miss
- Delivered from cache (Age)
- Common mobile setup
- Soft 404 check

---

### 🟢 PSI (3 rules) - Tests PageSpeed Insights API

**Configuration Required**: `google_page_speed_insights_key`
**Default State**: Enabled by default
**Auto-Enable**: When API key is set

All 3 rules return `runtime_error` if API key not configured:

1. **psi:mobile** - PSI v5 Mobile score
2. **psi:desktop** - PSI v5 Desktop score
3. **psi:mobile-fcp-tbt** - PSI v5 Mobile FCP/TBT

---

### 🟣 GSC (5 rules) - Tests Google Search Console API

**Configuration Required**: Google OAuth token + `gsc_site_url`
**Default State**: Disabled by default
**Auto-Enable**: When authenticated AND site URL set

All 5 rules return `runtime_error` if not configured:

1. **gsc:property-available** - GSC webproperty available
2. **gsc:is-indexed** - GSC is indexed (via impressions)
3. **gsc:top-queries-of-page** - GSC Top queries of page
4. **gsc:page-worldwide** - GSC page worldwide analytics
5. **gsc:directory-worldwide** - GSC directory worldwide analytics

---

## Error Types

### 🔴 error - Page/Content Issues
**Color**: Red
**Priority**: Highest (0)
**Meaning**: The page itself has a problem

Examples:
- Missing title tag
- Broken canonical link
- HTTP 404/500 errors
- Security issues
- Missing required meta tags

### 🟠 runtime_error - System/Configuration Issues
**Color**: Orange
**Priority**: High (1)
**Meaning**: Rule execution failed OR not configured

Examples:
- "PageSpeed Insights API key not configured. Set google_page_speed_insights_key in settings."
- "Google Search Console not authenticated. Sign in with Google in settings."
- "GSC site URL not configured. Set gsc_site_url in settings."
- Rule threw exception during execution

### 🟡 warn - Warnings
**Color**: Amber
**Priority**: Medium (2)

### 🔵 info - Informational
**Color**: Blue
**Priority**: Low (3)

### 🟢 ok - Success
**Color**: Green
**Priority**: Lowest (4)

---

## UI Display

### Settings UI (`/settings`)
- All **100 rules** display in grid layout
- Each rule shows:
  - Rule name
  - Rule ID
  - **Blue badge** with test type (`STATIC`, `HTTP`, `PSI`, `GSC`)
  - Checkbox to enable/disable
  - "auto" indicator for auto-enabled rules

### Results Display
- Results show **colored tags** for `what` field
- `runtime_error` displays with **orange styling** (distinct from red errors)
- Results sorted by priority: error → runtime_error → warn → info → ok

---

## Auto-Enable Configuration

Located in: `v7/src/rules/autoEnable.ts`

### PSI Rules (3)
```typescript
{ id: 'psi:mobile', vars: ['google_page_speed_insights_key'] }
{ id: 'psi:desktop', vars: ['google_page_speed_insights_key'] }
{ id: 'psi:mobile-fcp-tbt', vars: ['google_page_speed_insights_key'] }
```

### GSC Rules (5)
```typescript
{ id: 'gsc:property-available', token: true }
{ id: 'gsc:is-indexed', vars: ['gsc_site_url'], token: true }
{ id: 'gsc:top-queries-of-page', vars: ['gsc_site_url'], token: true }
{ id: 'gsc:page-worldwide', vars: ['gsc_site_url'], token: true }
{ id: 'gsc:directory-worldwide', vars: ['gsc_site_url'], token: true }
```

---

## Files Modified

### Core Types (3 files)
- `v7/src/core/types.ts` - Added `what` to Rule, `runtime_error` to Result
- `v7/src/rules/inventory.ts` - Export `what` in RuleSummary
- `v7/src/shared/results.ts` - Type definitions updated

### All Rules (100 files)
- Added `what: 'static' | 'http' | 'psi' | 'gsc'` to each rule

### Configuration Checks (8 files)
- `v7/src/rules/google/psi/mobile.ts`
- `v7/src/rules/google/psi/desktop.ts`
- `v7/src/rules/google/psi/mobileFcpTbt.ts`
- `v7/src/rules/google/gsc/propertyAvailable.ts`
- `v7/src/rules/google/gsc/isIndexed.ts`
- `v7/src/rules/google/gsc/topQueriesOfPage.ts`
- `v7/src/rules/google/gsc/pageWorldwideSearchAnalytics.ts`
- `v7/src/rules/google/gsc/pageDirectoryWorldwideSearchAnalytics.ts`

### Error Handling (1 file)
- `v7/src/core/run.ts` - Catch and report runtime errors

### UI Components (4 files)
- `v7/src/settings/RuleToggles.tsx` - Display `what` tags
- `v7/src/components/result/ResultHeader.tsx` - Display `what` tags
- `v7/src/shared/colorDefs.ts` - Add `runtime_error` colors
- `v7/src/shared/colors.ts` - Update sort order

---

## Quality Assurance

### Verification Script
Created: `v7/scripts/verify-all-rules.ts`

Checks:
1. ✓ Registry has 100 rules
2. ✓ Inventory has 100 rules
3. ✓ All rules have required fields (id, name, enabled, run)
4. ✓ All rules have `what` field
5. ✓ Rules grouped by type (gsc: 5, http: 22, psi: 3, static: 70)
6. ✓ All 3 PSI rules present
7. ✓ All 5 GSC rules present and disabled by default
8. ✓ No duplicate rule IDs
9. ✓ Inventory matches registry perfectly

Run verification:
```bash
npx tsx scripts/verify-all-rules.ts
```

### Build Commands
```bash
npm run typecheck  # ✓ 0 errors
npm run lint       # ✓ 0 violations
npm run build      # ✓ Success
```

---

## Summary

✅ **All 100 rules properly registered**
✅ **All rules have `what` field with correct test type**
✅ **PSI and GSC rules configured with runtime_error checks**
✅ **All rules display in settings with visual tags**
✅ **Runtime errors display with distinct orange styling**
✅ **No TypeScript errors, no lint violations**
✅ **Build successful**

**The rule system is production-ready! 🚀**
