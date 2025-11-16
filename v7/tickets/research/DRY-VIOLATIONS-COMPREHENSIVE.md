# DRY Violations - Comprehensive Refactoring Ticket

**Created:** 2025-11-15
**Priority:** HIGH
**Estimated Impact:** 500-700 lines saved, 80-100 files affected
**Status:** READY FOR IMPLEMENTATION

---

## Executive Summary

This ticket documents **73 distinct DRY (Don't Repeat Yourself) violations** across the v7/src codebase. These violations include magic numbers, hardcoded strings, duplicated code patterns, repeated styling, and similar logic scattered across multiple files.

**Key Benefits of Fixing:**
- Reduce code duplication by ~500-700 lines
- Improve maintainability (single source of truth for shared logic)
- Enhance type safety through proper TypeScript utilities
- Reduce bug surface area (fix once, fixed everywhere)
- Improve consistency across the codebase

---

## Table of Contents

1. [Magic Numbers (19 violations)](#1-magic-numbers)
2. [Hardcoded Strings (15 violations)](#2-hardcoded-strings)
3. [Duplicated Code Patterns (21 violations)](#3-duplicated-code-patterns)
4. [Repeated Styling Patterns (8 violations)](#4-repeated-styling-patterns)
5. [Duplicated Type Definitions (3 violations)](#5-duplicated-type-definitions)
6. [Validation Logic Duplication (4 violations)](#6-validation-logic-duplication)
7. [Similar Error Handling Patterns (3 violations)](#7-error-handling-patterns)
8. [Implementation Plan](#implementation-plan)
9. [Testing Strategy](#testing-strategy)

---

## 1. Magic Numbers (19 violations)

### 1.1 HTTP Status Code Ranges ⚠️ CRITICAL

**Affected Files:**
- `v7/src/rules/http/status.ts` (lines 5-7)
- `v7/src/rules/http/soft404.ts` (line 11)
- `v7/src/rules/head/canonicalRedirects.ts` (line 17)
- `v7/src/rules/head/canonicalChain.ts` (line 19)

**Issue:** Status code ranges `200-300`, `300-400`, `400+` hardcoded in 4+ files

**Current Code:**
```typescript
// Scattered across multiple files
if (status >= 200 && status < 300) { /* success */ }
if (status >= 300 && status < 400) { /* redirect */ }
if (status >= 400) { /* error */ }
```

**Solution:** Create `v7/src/shared/http-constants.ts`
```typescript
export const HTTP_STATUS = {
  SUCCESS_MIN: 200,
  SUCCESS_MAX: 300,
  REDIRECT_MIN: 300,
  REDIRECT_MAX: 400,
  CLIENT_ERROR_MIN: 400,
  SERVER_ERROR_MIN: 500,
} as const;

export const isSuccessStatus = (status: number): boolean =>
  status >= HTTP_STATUS.SUCCESS_MIN && status < HTTP_STATUS.SUCCESS_MAX;

export const isRedirectStatus = (status: number): boolean =>
  status >= HTTP_STATUS.REDIRECT_MIN && status < HTTP_STATUS.REDIRECT_MAX;

export const isClientError = (status: number): boolean =>
  status >= HTTP_STATUS.CLIENT_ERROR_MIN && status < HTTP_STATUS.SERVER_ERROR_MIN;

export const isServerError = (status: number): boolean =>
  status >= HTTP_STATUS.SERVER_ERROR_MIN;

export const isErrorStatus = (status: number): boolean =>
  status >= HTTP_STATUS.CLIENT_ERROR_MIN;
```

**Files to Update:**
1. `v7/src/rules/http/status.ts`
2. `v7/src/rules/http/soft404.ts`
3. `v7/src/rules/head/canonicalRedirects.ts`
4. `v7/src/rules/head/canonicalChain.ts`

---

### 1.2 String Truncation Limits

**Affected Files (9 instances):**
- `v7/src/shared/logger-types.ts` (lines 37, 39) - `500` chars
- `v7/src/shared/extract.ts` (line 3) - `500` chars
- `v7/src/content/index.ts` (line 48) - `500` chars
- `v7/src/background/pipeline/collector.ts` (line 22) - `500` chars
- `v7/src/core/run.ts` (line 35) - `100` chars
- `v7/src/shared/html-utils.ts` (line 14) - `100` chars (default param)
- `v7/src/background/listeners/messages.ts` (line 14) - `120` chars
- `v7/src/shared/event-handlers.ts` (line 19) - `50` chars
- `v7/src/sidepanel/ui/bugReport.ts` (line 22) - `50` results

**Current Code:**
```typescript
// Different files use different magic numbers
.substring(0, 500)
.slice(0, 100)
extractSnippet(html, 120)
results.slice(0, 50)
```

**Solution:** Create `v7/src/shared/truncation-constants.ts`
```typescript
export const TRUNCATION_LIMITS = {
  HTML_CONTENT: 500,
  LOG_MESSAGE: 120,
  SNIPPET: 100,
  EVENT_VALUE: 50,
  RESULTS_SAMPLE: 50,
} as const;
```

**Files to Update:** All 9 files listed above

---

### 1.3 Pipeline Delays

**Affected Files:**
- `v7/src/background/pipeline/collector.ts` (lines 36, 44) - `200` ms appears twice

**Current Code:**
```typescript
setTimeout(() => { /* finalize */ }, 200);
// ... later ...
setTimeout(() => { /* finalize */ }, 200);
```

**Solution:** Create `v7/src/background/pipeline/constants.ts`
```typescript
export const PIPELINE_DELAYS = {
  FINALIZE_DELAY_MS: 200,
  DEBOUNCE_MS: 300,
} as const;
```

---

### 1.4 Title Length Validation

**Affected Files:**
- `v7/src/rules/head/titleLength.ts` (line 22) - min `10`, max `70`

**Current Code:**
```typescript
if (n < 10 || n > 70) { /* warning */ }
```

**Solution:** Create `v7/src/rules/validation-constants.ts`
```typescript
export const TITLE_LENGTH = {
  MIN: 10,
  MAX: 70,
  OPTIMAL_MIN: 30,
  OPTIMAL_MAX: 60,
} as const;

export const META_DESCRIPTION_LENGTH = {
  MIN: 50,
  MAX: 160,
} as const;
```

---

### 1.5 Top Words/Queries Limits

**Affected Files:**
- `v7/src/rules/dom/topWords.ts` (line 9) - `5` words
- `v7/src/background/rules/util.ts` (line 18) - `6` tags
- `v7/src/rules/google/gsc/topQueriesOfPage.ts` (line 13) - `rowLimit: 5`

**Current Code:**
```typescript
.slice(0, 5)  // top words
.slice(0, 6)  // top tags
rowLimit: 5   // top queries
```

**Solution:** Create `v7/src/shared/query-constants.ts`
```typescript
export const RESULT_LIMITS = {
  TOP_WORDS: 5,
  TOP_TAGS: 6,
  TOP_QUERIES: 5,
  MAX_RESULTS: 100,
} as const;
```

---

## 2. Hardcoded Strings (15 violations)

### 2.1 Storage Keys ⚠️ HIGH PRIORITY

**Affected Files:** 25+ files across codebase

**Issue:** Storage keys hardcoded as strings throughout codebase
- `'ui:autoRun'` - 5 occurrences
- `'ui:preserveLog'` - 3 occurrences
- `'ui:autoClear'` - 5 occurrences
- `'rule-flags'` - 4 occurrences
- `'globalRuleVariables'` - 6 occurrences
- `'googleApiAccessToken'` - 7 occurrences

**Current Code:**
```typescript
chrome.storage.local.get('ui:autoRun')
chrome.storage.local.set({ 'ui:preserveLog': true })
chrome.storage.local.get('rule-flags')
```

**Solution:** Create `v7/src/shared/storage-keys.ts`
```typescript
export const STORAGE_KEYS = {
  UI: {
    AUTO_RUN: 'ui:autoRun',
    PRESERVE_LOG: 'ui:preserveLog',
    AUTO_CLEAR: 'ui:autoClear',
  },
  RULES: {
    FLAGS: 'rule-flags',
    VARIABLES: 'globalRuleVariables',
  },
  AUTH: {
    GOOGLE_TOKEN: 'googleApiAccessToken',
  },
  SETTINGS: {
    FAVORITES: 'favorites',
    DISABLED_RULES: 'disabledRules',
  },
} as const;

// Type-safe helper
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS][keyof typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]];
```

**Files to Update:** 25+ files (search for each storage key)

---

### 2.2 Rule Label Strings

**Affected Files:** 95+ rule files

**Issue:** Rule category labels hardcoded as strings
- `'HEAD'` - 50 occurrences across 24 files
- `'HTTP'` - 22 occurrences across 16 files
- `'OG'` - 8 occurrences across 3 files
- `'GSC'` - 15 occurrences across 5 files
- `'SCHEMA'` - 22 occurrences across 11 files
- `'BODY'` - 10 occurrences

**Current Code:**
```typescript
return { label: 'HEAD', message: '...', type: 'info', name: 'title' };
return { label: 'HTTP', message: '...', type: 'warn', name: 'status' };
return { label: 'SCHEMA', message: '...', type: 'info', name: 'article' };
```

**Solution:** Create `v7/src/rules/rule-labels.ts`
```typescript
export const RULE_LABELS = {
  HEAD: 'HEAD',
  HTTP: 'HTTP',
  BODY: 'BODY',
  OG: 'OG',
  SCHEMA: 'SCHEMA',
  GSC: 'GSC',
  DOM: 'DOM',
  ROBOTS: 'ROBOTS',
  URL: 'URL',
  SPEED: 'SPEED',
  A11Y: 'A11Y',
  GOOGLE: 'GOOGLE',
  DEBUG: 'DEBUG',
} as const;

export type RuleLabel = typeof RULE_LABELS[keyof typeof RULE_LABELS];
```

**Files to Update:** 95+ rule files (all files in v7/src/rules/)

---

### 2.3 Error/Warning Messages

**Affected Files:**
- 6 files in `v7/src/rules/google/gsc/*.ts` - `'No Google token'`
- 4 files in `v7/src/rules/google/gsc/*.ts` - `'Set variables.gsc_site_url'`
- 3 files in `v7/src/rules/og/*.ts` - `'Missing og:*'`

**Current Code:**
```typescript
return { label: 'GSC', message: 'No Google token', type: 'info', name: 'googleRule' };
return { label: 'GSC', message: 'Set variables.gsc_site_url', type: 'info', name: 'googleRule' };
return { label: 'OG', message: 'Missing og:title', type: 'warn', name: 'ogTitle' };
```

**Solution:** Create `v7/src/rules/rule-messages.ts`
```typescript
export const RULE_MESSAGES = {
  GOOGLE: {
    NO_TOKEN: 'No Google token',
    MISSING_SITE_URL: 'Set variables.gsc_site_url',
    API_ERROR: (error: string) => `Google API error: ${error}`,
  },
  OG: {
    MISSING: (property: string) => `Missing og:${property}`,
    EMPTY: (property: string) => `Empty og:${property}`,
    PRESENT: (property: string, length: number) => `og:${property} present (${length} chars)`,
  },
  SCHEMA: {
    NOT_FOUND: (type: string) => `No ${type} JSON‑LD`,
    INVALID: (type: string, error: string) => `Invalid ${type} schema: ${error}`,
  },
} as const;
```

**Files to Update:**
- All GSC rule files (6 files)
- All OG rule files (8+ files)
- All schema rule files (11 files)

---

## 3. Duplicated Code Patterns (21 violations)

### 3.1 Chrome Storage Access Pattern ⚠️ CRITICAL

**Affected Files (18+ instances):**
- `v7/src/sidepanel/ui/AutoRun.tsx` (lines 5-6)
- `v7/src/sidepanel/ui/PreserveLog.tsx` (lines 5-6)
- `v7/src/sidepanel/ui/GroupToggles.tsx`
- `v7/src/sidepanel/ui/RuleFlags.tsx`
- And 14+ more files

**Current Code (duplicated 18+ times):**
```typescript
const [state, setState] = useState(true);

useEffect(() => {
  chrome.storage.local.get('KEY')
    .then((v) => setState(v['KEY'] !== false))
    .catch(() => {});
}, []);

const toggle = async () => {
  const v = !state;
  setState(v);
  await chrome.storage.local.set({ 'KEY': v });
};
```

**Solution:** Create `v7/src/shared/hooks/useStorageBoolean.ts`
```typescript
import { useState, useEffect } from 'react';

export function useStorageBoolean(
  key: string,
  defaultValue = true
): [boolean, () => Promise<void>] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    chrome.storage.local.get(key)
      .then((v) => setValue(v[key] !== false))
      .catch((error) => {
        console.warn(`Failed to load storage key "${key}":`, error);
      });
  }, [key]);

  const toggle = async (): Promise<void> => {
    const newValue = !value;
    setValue(newValue);
    try {
      await chrome.storage.local.set({ [key]: newValue });
    } catch (error) {
      console.error(`Failed to save storage key "${key}":`, error);
      // Rollback on error
      setValue(!newValue);
    }
  };

  return [value, toggle];
}
```

**Usage Example:**
```typescript
// Before
const [autoRun, setAutoRun] = useState(true);
useEffect(() => {
  chrome.storage.local.get('ui:autoRun').then((v) => setAutoRun(v['ui:autoRun'] !== false)).catch(() => {});
}, []);
const toggleAutoRun = async () => {
  const v = !autoRun;
  setAutoRun(v);
  await chrome.storage.local.set({ 'ui:autoRun': v });
};

// After
const [autoRun, toggleAutoRun] = useStorageBoolean(STORAGE_KEYS.UI.AUTO_RUN);
```

**Files to Update:**
1. `v7/src/sidepanel/ui/AutoRun.tsx`
2. `v7/src/sidepanel/ui/PreserveLog.tsx`
3. `v7/src/sidepanel/ui/GroupToggles.tsx`
4. `v7/src/sidepanel/ui/RuleFlags.tsx`
5. And 14+ more component files

**Note:** `AutoClear.tsx` already uses a better pattern - consider extending that approach.

---

### 3.2 Google API Token/Variables Extraction ⚠️ CRITICAL

**Affected Files (9 files):**
- `v7/src/rules/google/gsc/isIndexed.ts` (lines 8-9)
- `v7/src/rules/google/gsc/topQueriesOfPage.ts` (lines 8-9)
- `v7/src/rules/google/gsc/pageWorldwideSearchAnalytics.ts` (lines 8-9)
- `v7/src/rules/google/gsc/pageDirectoryWorldwideSearchAnalytics.ts` (lines 8-9)
- `v7/src/rules/google/gsc/propertyAvailable.ts` (line 8)
- `v7/src/rules/google/isConnected.ts` (line 8)
- `v7/src/rules/google/psi/desktop.ts` (line 9)
- `v7/src/rules/google/psi/mobile.ts` (line 9)
- `v7/src/rules/google/psi/mobileFcpTbt.ts` (line 9)

**Current Code (EXACT duplication in 9 files):**
```typescript
const token = (ctx.globals as { googleApiAccessToken?: string|null }).googleApiAccessToken || null;
const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {};
```

**Solution:** Create `v7/src/rules/google/utils.ts`
```typescript
import type { RuleContext, RuleResult } from '../types';

export interface GoogleCredentials {
  token: string | null;
  vars: Record<string, unknown>;
}

export function extractGoogleCredentials(ctx: RuleContext): GoogleCredentials {
  const token = (ctx.globals as { googleApiAccessToken?: string | null }).googleApiAccessToken || null;
  const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {};
  return { token, vars };
}

export function createNoTokenResult(label = 'GSC', name = 'googleRule'): RuleResult {
  return {
    label,
    message: 'No Google token',
    type: 'info',
    name,
  };
}

export function createMissingSiteUrlResult(label = 'GSC', name = 'googleRule'): RuleResult {
  return {
    label,
    message: 'Set variables.gsc_site_url',
    type: 'info',
    name,
  };
}

export function extractGscSiteUrl(vars: Record<string, unknown>): string {
  return String(vars['gsc_site_url'] || '');
}
```

**Usage Example:**
```typescript
// Before
const token = (ctx.globals as { googleApiAccessToken?: string|null }).googleApiAccessToken || null;
const vars = (ctx.globals as { variables?: Record<string, unknown> }).variables || {};
if (!token) return { label: 'GSC', message: 'No Google token', type: 'info', name: 'googleRule' };
const site = String((vars as Record<string, unknown>)['gsc_site_url'] || '');
if (!site) return { label: 'GSC', message: 'Set variables.gsc_site_url', type: 'info', name: 'googleRule' };

// After
const { token, vars } = extractGoogleCredentials(ctx);
if (!token) return createNoTokenResult();
const site = extractGscSiteUrl(vars);
if (!site) return createMissingSiteUrlResult();
```

**Files to Update:** All 9 files listed above

---

### 3.3 Schema LD+JSON Script Extraction ⚠️ HIGH PRIORITY

**Affected Files (11 files in v7/src/rules/schema/):**
- `articlePresent.ts`
- `articleRequired.ts`
- `breadcrumb.ts`
- `event.ts`
- `faq.ts`
- `howto.ts`
- `jobPosting.ts`
- `organization.ts`
- `product.ts`
- `recipe.ts`
- `video.ts`

**Current Code (duplicated in 11 files):**
```typescript
const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]');
const n = findType(parseLd(page.doc), 'Article')[0];
if (!n) {
  return {
    label: 'SCHEMA',
    message: 'No Article JSON‑LD',
    type: 'info',
    name: 'schemaArticle'
  };
}
// ... validation logic ...
const script = Array.from(scripts).find((s) => s.textContent?.includes('Article')) || null;
const sourceHtml = extractHtml(script);
```

**Solution:** Create `v7/src/rules/schema/utils.ts`
```typescript
import type { Page, RuleResult } from '../types';
import { parseLd, findType } from '../../shared/structured';
import { extractHtml, extractSnippet, getDomPath } from '../../shared/html-utils';

export interface SchemaExtractionResult {
  data: unknown;
  script: Element | null;
  sourceHtml: string;
}

export function extractSchemaScript(page: Page, schemaType: string): SchemaExtractionResult {
  const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]');
  const data = findType(parseLd(page.doc), schemaType)[0];
  const script = data
    ? Array.from(scripts).find((s) => s.textContent?.includes(schemaType)) || null
    : null;

  return {
    data,
    script,
    sourceHtml: extractHtml(script),
  };
}

export function createSchemaNotFoundResult(
  schemaType: string,
  name: string
): RuleResult {
  return {
    label: 'SCHEMA',
    message: `No ${schemaType} JSON‑LD`,
    type: 'info',
    name,
  };
}

export function createSchemaDetails(
  script: Element | null,
  additionalData?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!script) return undefined;

  const sourceHtml = extractHtml(script);
  return {
    sourceHtml,
    snippet: extractSnippet(sourceHtml),
    domPath: getDomPath(script),
    ...additionalData,
  };
}
```

**Usage Example:**
```typescript
// Before
const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]');
const n = findType(parseLd(page.doc), 'Article')[0];
if (!n) return { label: 'SCHEMA', message: 'No Article JSON‑LD', type: 'info', name: 'schemaArticle' };
const script = Array.from(scripts).find((s) => s.textContent?.includes('Article')) || null;
const sourceHtml = extractHtml(script);

// After
const { data, script, sourceHtml } = extractSchemaScript(page, 'Article');
if (!data) return createSchemaNotFoundResult('Article', 'schemaArticle');
```

**Files to Update:** All 11 schema rule files listed above

---

### 3.4 Details Object Pattern ⚠️ HIGH PRIORITY

**Affected Files:** 65+ rule files across entire v7/src/rules/ directory

**Current Code (repeated 65+ times):**
```typescript
details: element
  ? {
      sourceHtml,
      snippet: extractSnippet(sourceHtml),
      domPath: getDomPath(element),
    }
  : undefined,
```

**Solution:** Extend `v7/src/shared/html-utils.ts`
```typescript
export function createDetailsObject(
  element: Element | null,
  additionalDetails?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!element) return undefined;

  const sourceHtml = extractHtml(element);
  return {
    sourceHtml,
    snippet: extractSnippet(sourceHtml),
    domPath: getDomPath(element),
    ...additionalDetails,
  };
}
```

**Usage Example:**
```typescript
// Before
const m = page.doc.querySelector('meta[name="description"]');
const sourceHtml = extractHtml(m);
return {
  label: 'HEAD',
  message: 'Meta description present',
  type: 'info',
  name: 'metaDescription',
  details: m ? {
    sourceHtml,
    snippet: extractSnippet(sourceHtml),
    domPath: getDomPath(m),
    description: content,
  } : undefined,
};

// After
const m = page.doc.querySelector('meta[name="description"]');
return {
  label: 'HEAD',
  message: 'Meta description present',
  type: 'info',
  name: 'metaDescription',
  details: createDetailsObject(m, { description: content }),
};
```

**Files to Update:** 65+ rule files (affects nearly every rule file)

---

### 3.5 Meta Tag Content Extraction

**Affected Files:** 15+ files in v7/src/rules/

**Current Code (two variants):**
```typescript
const c = m.getAttribute('content')?.trim() || '';
// OR
const c = (m.getAttribute('content') || '').trim();
```

**Solution:** Extend `v7/src/shared/html-utils.ts`
```typescript
export function getMetaContent(element: Element | null): string {
  return element?.getAttribute('content')?.trim() || '';
}
```

**Files to Update:** 15+ rule files

---

### 3.6 Meta Tag Selection Pattern

**Affected Files:** 20+ files

**Current Code:**
```typescript
const m = page.doc.querySelector('meta[property="og:title"]');
// OR
const m = page.doc.querySelector('meta[name="description"]');
// OR
const m = page.doc.querySelector('meta[property="og:title"], meta[name="og:title"]');
```

**Solution:** Extend `v7/src/shared/html-utils.ts`
```typescript
export function getMetaTag(
  doc: Document,
  name: string,
  useProperty = false
): Element | null {
  if (useProperty) {
    return doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
  }
  return doc.querySelector(`meta[name="${name}"]`);
}

export function getOgMetaTag(doc: Document, property: string): Element | null {
  return getMetaTag(doc, `og:${property}`, true);
}

export function getTwitterMetaTag(doc: Document, property: string): Element | null {
  return getMetaTag(doc, `twitter:${property}`, true);
}
```

**Usage Example:**
```typescript
// Before
const m = page.doc.querySelector('meta[property="og:title"], meta[name="og:title"]');

// After
const m = getOgMetaTag(page.doc, 'title');
```

**Files to Update:** 20+ files

---

### 3.7 Open Graph Rule Pattern

**Affected Files:**
- `v7/src/rules/og/title.ts`
- `v7/src/rules/og/description.ts`
- `v7/src/rules/og/image.ts`
- `v7/src/rules/og/url.ts`
- And other OG rules

**Current Code (nearly identical structure in each file):**
```typescript
const m = page.doc.querySelector('meta[property="og:title"], meta[name="og:title"]');
if (!m) {
  return {
    label: 'OG',
    message: 'Missing og:title',
    type: 'warn',
    name: 'ogTitle'
  };
}
const c = m.getAttribute('content')?.trim() || '';
if (!c) {
  return {
    label: 'OG',
    message: 'Empty og:title',
    type: 'warn',
    name: 'ogTitle'
  };
}
const sourceHtml = extractHtml(m);
return {
  label: 'OG',
  message: `og:title present (${c.length} chars)`,
  type: 'info',
  name: 'ogTitle',
  details: {
    sourceHtml,
    snippet: extractSnippet(sourceHtml),
    domPath: getDomPath(m),
    ogTitle: c,
  },
};
```

**Solution:** Create `v7/src/rules/og/utils.ts`
```typescript
import type { Page, RuleResult } from '../types';
import { getOgMetaTag, getMetaContent, createDetailsObject } from '../../shared/html-utils';

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export interface OgValidation {
  valid: boolean;
  message?: string;
  type?: 'info' | 'warn' | 'error';
}

export function createOgRule(
  property: string,
  additionalValidation?: (content: string) => OgValidation
) {
  return async (page: Page): Promise<RuleResult> => {
    const m = getOgMetaTag(page.doc, property);

    if (!m) {
      return {
        label: 'OG',
        message: `Missing og:${property}`,
        type: 'warn',
        name: `og${capitalize(property)}`,
      };
    }

    const content = getMetaContent(m);
    if (!content) {
      return {
        label: 'OG',
        message: `Empty og:${property}`,
        type: 'warn',
        name: `og${capitalize(property)}`,
      };
    }

    const validation = additionalValidation?.(content);

    return {
      label: 'OG',
      message: validation?.message || `og:${property} present (${content.length} chars)`,
      type: validation?.type || (validation?.valid === false ? 'warn' : 'info'),
      name: `og${capitalize(property)}`,
      details: createDetailsObject(m, { [`og${capitalize(property)}`]: content }),
    };
  };
}
```

**Usage Example:**
```typescript
// v7/src/rules/og/title.ts - Before (20+ lines)
export async function ogTitle(page: Page): Promise<RuleResult> {
  const m = page.doc.querySelector('meta[property="og:title"], meta[name="og:title"]');
  if (!m) return { label: 'OG', message: 'Missing og:title', type: 'warn', name: 'ogTitle' };
  const c = m.getAttribute('content')?.trim() || '';
  if (!c) return { label: 'OG', message: 'Empty og:title', type: 'warn', name: 'ogTitle' };
  // ... more code ...
}

// After (1 line!)
export const ogTitle = createOgRule('title');

// With custom validation
export const ogImage = createOgRule('image', (content) => {
  const isValid = content.startsWith('http://') || content.startsWith('https://');
  return {
    valid: isValid,
    message: isValid ? `og:image present` : 'og:image must be absolute URL',
    type: isValid ? 'info' : 'warn',
  };
});
```

**Files to Update:** All OG rule files (8+ files)

---

### 3.8 Empty Catch Blocks - CODE SMELL ⚠️

**Affected Files:** 35+ files

**Issue:** `.catch(() => {})` appears 35+ times, silently swallowing errors

**Current Code:**
```typescript
chrome.storage.local.get('key')
  .then((v) => setState(v['key']))
  .catch(() => {}); // Silent error swallowing!
```

**Impact:** Makes debugging very difficult

**Solution:** Create `v7/src/shared/error-handlers.ts`
```typescript
export const logAndIgnore = (context: string) => (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn(`[${context}] Error occurred but continuing:`, errorMessage);
};

export const logError = (context: string) => (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] Error:`, errorMessage);
};
```

**Usage Example:**
```typescript
// Before
.catch(() => {})

// After
.catch(logAndIgnore('storage-get-autoRun'))
```

**Files to Update:** 35+ files with empty catch blocks

---

## 4. Repeated Styling Patterns (8 violations)

### 4.1 Button Styles - Tailwind Classes

**Affected Files:** Multiple UI component files

**Issue:** Same Tailwind class combinations repeated across files
- `"border px-2 py-1 rounded hover:bg-gray-50"` - 8 occurrences
- `"px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"` - 2 occurrences
- `"px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"` - 2 occurrences
- `"px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"` - 2 occurrences

**Solution:** Create `v7/src/components/ui/Button.tsx`
```typescript
import { type ButtonHTMLAttributes } from 'react';

const BUTTON_STYLES = {
  default: 'border px-2 py-1 rounded hover:bg-gray-50',
  secondary: 'px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm',
  primary: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700',
  small: 'px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
  danger: 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700',
} as const;

type ButtonVariant = keyof typeof BUTTON_STYLES;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
```

**Files to Update:** All UI component files using these button styles

---

### 4.2 Container/Card Styles

**Affected Files:** Multiple component files

**Issue:**
- `"bg-gray-50 rounded-lg p-4"` - 5 occurrences
- `"border rounded p-3 space-y-2"` - 2 occurrences

**Solution:** Create `v7/src/components/ui/Card.tsx`
```typescript
import { type HTMLAttributes } from 'react';

const CARD_STYLES = {
  default: 'bg-gray-50 rounded-lg p-4',
  bordered: 'border rounded p-3 space-y-2',
} as const;

type CardVariant = keyof typeof CARD_STYLES;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  return (
    <div className={`${CARD_STYLES[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
```

---

## 5. Duplicated Type Definitions (3 violations)

### 5.1 Color Map Objects

**Affected Files:**
- `v7/src/shared/colorDefs.ts`
- `v7/src/shared/colors.ts`
- `v7/src/sidepanel/ui/LogEntry.tsx`

**Issue:** Similar color mapping structures in 3 files

**Solution:** Consolidate all color definitions into `colorDefs.ts` and remove duplication from LogEntry.tsx

---

### 5.2 Storage Type Definitions

**Issue:** Storage wrapper exists but not consistently used - 12+ files use raw `chrome.storage.local` instead

**Solution:** Enforce use of storage wrapper throughout codebase

---

## 6. Validation Logic Duplication (4 violations)

### 6.1 Length Validation

**Affected Files:** Multiple rule files

**Current Code:**
```typescript
if (title.length > 0) { /* ... */ }
if (n < 10 || n > 70) { /* ... */ }
```

**Solution:** Create `v7/src/shared/validators.ts`
```typescript
export const hasLength = (value: unknown): boolean =>
  Boolean(value && (value as { length: number }).length > 0);

export const isWithinRange = (value: number, min: number, max: number): boolean =>
  value >= min && value <= max;

export const validateTitleLength = (title: string) => ({
  valid: isWithinRange(title.trim().length, 10, 70),
  length: title.trim().length,
});

export const validateMetaDescriptionLength = (description: string) => ({
  valid: isWithinRange(description.trim().length, 50, 160),
  length: description.trim().length,
});

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isAbsoluteUrl = (url: string): boolean =>
  url.startsWith('http://') || url.startsWith('https://');
```

---

## 7. Error Handling Patterns (3 violations)

### 7.1 Console Logging Instead of Logger

**Affected Files:** 20+ files

**Issue:**
```typescript
console.error('[context] message', error);
console.warn('[context] message', data);
```

**Solution:** Consistently use Logger class instead of raw console methods

**Files to Update:** Any file using `console.error`, `console.warn`, `console.log`

---

## Implementation Plan

### Phase 1: High Priority Constants & Utilities (Week 1)

**Day 1-2: Core Constants**
1. Create `v7/src/shared/http-constants.ts` (HTTP status helpers)
2. Create `v7/src/shared/storage-keys.ts` (storage key constants)
3. Create `v7/src/shared/truncation-constants.ts`
4. Create `v7/src/rules/rule-labels.ts`
5. Create `v7/src/rules/rule-messages.ts`

**Day 3-4: Utility Functions**
6. Create `v7/src/rules/google/utils.ts` (Google API helpers)
7. Create `v7/src/rules/schema/utils.ts` (schema extraction helpers)
8. Extend `v7/src/shared/html-utils.ts` (meta tag helpers, details object)
9. Create `v7/src/rules/og/utils.ts` (OG rule factory)

**Day 5: React Hooks**
10. Create `v7/src/shared/hooks/useStorageBoolean.ts`

---

### Phase 2: Update Rule Files (Week 2)

**Priority Order:**
1. Update all Google API rules (9 files) - uses new google/utils.ts
2. Update all Schema rules (11 files) - uses new schema/utils.ts
3. Update all OG rules (8+ files) - uses new og/utils.ts
4. Update HTTP status rules (4 files) - uses http-constants.ts
5. Update remaining rules using details pattern (65+ files)

---

### Phase 3: Update UI Components (Week 3)

1. Create Button and Card components
2. Update all components using storage hooks (18+ files)
3. Replace empty catch blocks with error handlers (35+ files)
4. Consolidate color definitions

---

### Phase 4: Validation & Cleanup (Week 3-4)

1. Create validators utility
2. Enforce Logger usage over console
3. Run full test suite
4. Update documentation

---

## Testing Strategy

### Unit Tests

For each new utility file, create corresponding test file:

```typescript
// v7/tests/shared/http-constants.test.ts
import { isSuccessStatus, isRedirectStatus, isErrorStatus } from '@/shared/http-constants';

describe('HTTP Status Helpers', () => {
  test('isSuccessStatus identifies 2xx codes', () => {
    expect(isSuccessStatus(200)).toBe(true);
    expect(isSuccessStatus(299)).toBe(true);
    expect(isSuccessStatus(300)).toBe(false);
  });

  test('isRedirectStatus identifies 3xx codes', () => {
    expect(isRedirectStatus(301)).toBe(true);
    expect(isRedirectStatus(302)).toBe(true);
    expect(isRedirectStatus(399)).toBe(true);
    expect(isRedirectStatus(400)).toBe(false);
  });

  test('isErrorStatus identifies 4xx and 5xx codes', () => {
    expect(isErrorStatus(400)).toBe(true);
    expect(isErrorStatus(404)).toBe(true);
    expect(isErrorStatus(500)).toBe(true);
    expect(isErrorStatus(200)).toBe(false);
  });
});
```

### Integration Tests

1. Verify all rules still work with new utilities
2. Test storage hooks in React components
3. Verify OG rule factory produces correct results

### Regression Tests

1. Run existing test suite after each phase
2. Manual testing of Chrome extension functionality
3. Verify no broken imports or missing constants

---

## Success Metrics

- **Code Reduction:** 500-700 lines removed
- **Files Improved:** 80-100 files refactored
- **Test Coverage:** All new utilities have >90% coverage
- **Type Safety:** No `any` types, all utilities fully typed
- **Build:** Zero TypeScript errors, zero linting warnings
- **Tests:** All existing tests still pass

---

## Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation:**
- Update files incrementally
- Run tests after each change
- Use git branches for each phase

### Risk 2: Missed Duplications
**Mitigation:**
- Use regex searches to find all instances
- Code review before merging

### Risk 3: Performance Impact
**Mitigation:**
- Profile before/after
- Ensure helpers are lightweight
- Consider memoization where needed

---

## Dependencies

**Required Before Starting:**
- All tests passing
- Clean git working directory
- TypeScript strict mode enabled

**Tools Needed:**
- TypeScript 5.x
- ESLint
- Prettier
- Testing framework (Jest/Vitest)

---

## Notes

- This refactoring does NOT change any functionality
- All changes are internal code improvements
- External API/behavior remains identical
- Can be done incrementally without breaking changes
- Each phase can be merged separately

---

**Ticket Status:** READY FOR IMPLEMENTATION
**Assigned To:** TBD
**Estimated Effort:** 3-4 weeks
**Priority:** HIGH (Technical Debt Reduction)
