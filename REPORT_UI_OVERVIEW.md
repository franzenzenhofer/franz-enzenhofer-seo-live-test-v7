# Report UI Structure - Complete Overview & Code Map

## Executive Summary

The report UI is missing critical run metadata (Run ID and timestamp) due to a **data flow gap**. The metadata is captured and stored, but the Report component doesn't read it. This causes:

1. Users see different information in the side panel vs. report
2. No way to identify which run a report represents
3. Missing execution context (when, how long, what scope)
4. Poor information hierarchy in the header

---

## Critical Data Flow Gap

### The Problem
```
✓ runner.ts writes RunMeta to storage
  ↓
✓ Side Panel reads and displays it
  ↓
✗ Report DOESN'T read RunMeta
  ↓
✗ Report header missing: Run ID, Timestamp
```

### Quick Fix Required
The `useReportData()` hook in `/src/report/useReportData.ts` needs to also read RunMeta, not just results.

---

## File Structure & Paths

### Display Components
```
/v7/src/report/
├── ReportApp.tsx              (Main component - missing RunMeta read)
├── ReportHeader.tsx           (Needs props: runId, ranAt)
├── ReportSection.tsx          (Displays grouped results)
├── ResultBadges.tsx           (Shows error/warn/info/ok counts)
├── ExportButtons.tsx          (Copy JSON/HTML)
├── DetailsView.tsx            (Expandable detail view)
├── formatRuleName.ts          (Utility: formats rule names)
├── useReportData.ts           (NEEDS FIX: missing RunMeta)
├── types.ts                   (Type definitions)
└── main.tsx                   (Entry point)
```

### Result Display Components
```
/v7/src/components/result/
├── ResultCard.tsx             (Individual result with expand)
├── ResultHeader.tsx           (Result title + metadata)
└── ResultDetails.tsx          (Expanded details view)
```

### Data & Utilities
```
/v7/src/shared/
├── results.ts                 (Result type & storage funcs)
├── runMeta.ts                 (RunMeta type & storage funcs)
├── colors.ts                  (Color system & sort order)
└── chrome.ts                  (Chrome API helpers)
```

### Background Services
```
/v7/src/background/
├── index.ts                   (Service worker entry)
└── rules/
    ├── runner.ts              (Executes rules - WRITES RunMeta)
    └── util.ts                (Rule utilities)
```

---

## Key Data Types

### Result Type
**File:** `/v7/src/shared/results.ts`
```typescript
export type Result = {
  name: string              // "mobileFriendly"
  label: string             // "Mobile Friendly"
  message: string           // Main finding
  type: string              // "error" | "warn" | "info" | "ok"
  what?: string | null      // Formatted name override
  ruleId?: string | null    // Rule identifier
  priority?: number         // Priority ranking
  details?: {               // Optional extended data
    sourceHtml?: string     // HTML snippet
    snippet?: string        // Preview text
    domPath?: string        // CSS selector path
    [key: string]: unknown  // Other custom fields
  }
}
```

### RunMeta Type
**File:** `/v7/src/shared/runMeta.ts`
```typescript
export type RunMeta = { 
  url: string              // "https://example.com"
  ranAt: string            // ISO timestamp
  runId: string            // "run-{timestamp}-{random}"
}
```

**Storage:** `chrome.storage.local["results-meta:{tabId}"]`  
**Written by:** `runner.ts` line 62  
**Read by:** Side Panel only (NOT Report)

---

## Current Component Props & Structure

### ReportHeader Props (INCOMPLETE)
**File:** `/v7/src/report/ReportHeader.tsx` line 6-16
```typescript
{
  url: string                          // ✓ Passed
  resultCount: number                 // ✓ Passed
  groupedResults: Record<...>         // ✓ Passed
  results: Result[]                   // ✓ Passed
  // MISSING:
  runId?: string                      // ✗ NOT PASSED
  ranAt?: string                      // ✗ NOT PASSED
}
```

### ReportApp Component
**File:** `/v7/src/report/ReportApp.tsx`

**Line 9:** `const { results, url, loading } = useReportData()`
- Gets: results, url
- MISSING: runId, ranAt from RunMeta

**Line 50:** ReportHeader call - missing runId, ranAt props

---

## Information Being Displayed

### Currently Shown
```
┌─────────────────────────────────────┐
│ Live Test Report v0.1.54            │
│ https://example.com/page            │
│ [error:5] [warn:3] [info:2] [ok:1]  │
│ Total: 11  [Copy JSON] [Copy HTML]  │
└─────────────────────────────────────┘
```

### Missing (Should Show)
- Run ID: "run-1731605445123-a1b2c3d4"
- Timestamp: "Nov 14, 2025 at 3:30 PM"
- When run: "(ran 5 minutes ago)"
- Duration: "Took 2.3 seconds"
- Rules tested: "11 rules"

---

## Information Available But Not Displayed

### High Priority
| Item | Tracked | Stored | Side Panel Shows | Report Shows |
|------|---------|--------|-----------------|--------------|
| Run ID | ✓ | ✓ | ✓ "Run #run-..." | ✗ |
| Timestamp | ✓ | ✓ | ✓ "Nov 14, 3:30 PM" | ✗ |
| Test URL | ✓ | ✓ | ✓ | ✓ |
| Result counts | ✓ | ✓ | ✓ | ✓ |

### Medium Priority (Not tracked)
- Test duration (time to execute)
- Total rules enabled (count)
- Total rules executed (count)

### Low Priority (In events but not exposed)
- Navigation events count
- Request events count
- DOM snapshots captured
- HTML size
- First/last URLs

---

## How to Fix the Data Gap

### Current useReportData() Hook
**File:** `/v7/src/report/useReportData.ts`
```typescript
export const useReportData = () => {
  const [results, setResults] = useState<Result[]>([])
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabId = params.get('tabId')
    // ...reads results only
    const data = await readResults(tabIdNum)
    setResults(data)
  }, [])
  
  return { results, url, loading }
}
```

### Should Also Return
```typescript
// Add to state:
const [runMeta, setRunMeta] = useState<RunMeta | null>(null)

// Add to effect:
const meta = await readRunMeta(tabIdNum)
setRunMeta(meta)

// Add to return:
return { results, url, loading, runId: runMeta?.runId, ranAt: runMeta?.ranAt }
```

---

## Related Components Map

### How Data Flows in Side Panel (Works Correctly)
```
App.tsx (side panel)
├─ useResultsSource() → gets results
├─ useRunMeta() → gets RunMeta
└─ passes to AppBody
   └─ UrlBar displays:
      • URL
      • "Run #{runId}"
      • timestamp
      • "Show full report" button
```

### How Data Should Flow in Report (Currently Broken)
```
ReportApp.tsx
├─ useReportData() → currently gets results + url only
│  SHOULD ALSO get: runId, ranAt
├─ groups results
└─ passes to ReportHeader
   SHOULD PASS: url, runId, ranAt, resultCount
   SHOULD DISPLAY: title, URL, run info, timestamp
```

---

## Formatting & Utilities Available

### formatRuleName()
**File:** `/v7/src/report/formatRuleName.ts`
```typescript
// Converts: { what, name } → formatted name
// Priority: what > camelCase→"Title Case" > ""
// Usage: formatRuleName(result)
```

### getResultColor()
**File:** `/v7/src/shared/colors.ts`
```typescript
getResultColor(type) → {
  bg: "bg-red-50",
  border: "border-red-300",
  text: "text-red-900",
  dot: "bg-red-500",
  badge: "bg-red-100 text-red-800",
  full: "bg-red-50 border-red-300 text-red-900"
}
```

### resultSortOrder
**File:** `/v7/src/shared/colors.ts`
```typescript
{ error: 0, warn: 1, info: 2, ok: 3 }
// Used to sort result groups by priority
```

---

## Current Layout Issues

### Problem 1: Information Cramming
Current: `[Title] [URL] [Badges] [Total] [Buttons]` all on 2 lines

Issues:
- Long URL wraps awkwardly
- Badges and Total both redundant
- Export buttons disconnected
- No visual hierarchy

### Problem 2: Missing Metadata
- Run ID nowhere in report
- Timestamp nowhere in report
- No indication of when test ran

### Problem 3: Visual Hierarchy
- Version too small
- URL gets most space but isn't the focus
- Badges unclear (also in section headers)
- No separation between "what was tested" vs "results"

---

## Recommended Information Hierarchy

### Tier 1 (Essential)
- Test Report Title
- Overall Status: "✗ 5 Errors | ⚠ 3 Warnings | ✓ 2 Passed"
- Run Identity: "#run-123..."
- Timestamp: "Ran on Nov 14 at 3:30 PM"

### Tier 2 (Important)
- Tested URL (clickable)
- Version: "v0.1.54"
- Duration: "Took 2.3 seconds"
- Scope: "11 rules tested"

### Tier 3 (Context)
- Chrome version
- Events captured
- API integrations
- Export options

---

## Summary Table

| Aspect | Current | Problem | Fix |
|--------|---------|---------|-----|
| **Data Available** | RunMeta stored ✓ | Not read by report ✗ | Read in useReportData |
| **Data Passed** | url, counts ✓ | runId, ranAt missing ✗ | Add to ReportHeader props |
| **Data Displayed** | URL, badges ✓ | No run metadata ✗ | Render run info in header |
| **Layout** | 2-line flex ✓ | Poor hierarchy ✗ | Redesign with sections |
| **Duplication** | Badges shown twice ✓ | One source ✗ | Remove section headers? |

---

## Files to Modify

### Must Fix
1. **`/v7/src/report/useReportData.ts`** - Read RunMeta
2. **`/v7/src/report/ReportHeader.tsx`** - Display RunMeta, redesign layout
3. **`/v7/src/report/ReportApp.tsx`** - Pass RunMeta to header

### Should Consider
4. **`/v7/src/report/ResultBadges.tsx`** - Remove if duplicating section headers?
5. **`/v7/src/report/ExportButtons.tsx`** - Move to separate section?

---

## Complete Data Map

```
Background:
  runner.ts:11  → runId generation
  runner.ts:12  → runTimestamp capture
  runner.ts:62  → writeRunMeta() call
    ↓ writes to storage
    
Storage:
  "results-meta:{tabId}" → {url, ranAt, runId}
  "results:{tabId}" → Result[]
    ↙(Side Panel reads)  ↘(Report should read)
    
Side Panel:              Report:
  ✓ useRunMeta()         ✗ Missing!
  ✓ useResultsSource()   ✓ useReportData()
  ✓ UrlBar displays      ✗ No display
    
Display:
  Side Panel: "Run #run-123... · Nov 14 3:30 PM"
  Report: (missing completely)
```

---

This analysis provides everything needed to understand and redesign the report header with proper metadata display.

