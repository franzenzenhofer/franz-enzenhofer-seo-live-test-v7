# Report Header Redesign - Quick Reference

## The Core Problem (1 Sentence)
RunMeta (Run ID + timestamp) is stored and shown in the side panel but NOT read or displayed in the report due to a data flow gap.

---

## What's Available vs. What's Shown

### Data Available (Currently Unused in Report)
```typescript
RunMeta = {
  url: "https://example.com"
  ranAt: "2025-11-14T15:30:45.123Z"
  runId: "run-1731605445123-a1b2c3d4"
}
```

**Storage Key:** `chrome.storage.local["results-meta:{tabId}"]`  
**Read by:** Side Panel ✓ | Report ✗

### Result Counts
```typescript
Counts = {
  error: 5,
  warn: 3,
  info: 2,
  ok: 1
}
```

**Displayed:** ResultBadges (header) + ReportSection headers (duplicate)

---

## Current vs. Recommended Layout

### Current (2 lines)
```
Live Test Report v0.1.54
https://example.com/page    [error:5][warn:3][info:2][ok:1] Total: 11  [JSON][HTML]
```

**Problems:**
- URL wraps
- Version tiny
- No run metadata
- Badges redundant with section headers

### Recommended (4 sections)
```
┌─────────────────────────────────────────┐
│ Test Report                             │  Tier 1: Essential
│ ✗ 5 Errors | ⚠ 3 Warnings | ✓ 2 Passed│
│ Run #run-1731605445123-a1b2c3d4        │
│ Ran Nov 14, 2025 at 3:30 PM (5 min ago)│
├─────────────────────────────────────────┤
│ https://example.com/page                │  Tier 2: Important
│ v0.1.54 • Duration: 2.3s • 11 Rules   │
├─────────────────────────────────────────┤
│ [Copy JSON] [Copy HTML]                 │  Tier 3: Actions
└─────────────────────────────────────────┘
```

---

## Files That Need Changes

### 1. useReportData() Hook
**File:** `/v7/src/report/useReportData.ts`

**Current:** Only reads results and URL
**Fix:** Also read RunMeta
```typescript
// Add imports
import { readRunMeta } from '@/shared/runMeta'

// Add state
const [runMeta, setRunMeta] = useState<RunMeta | null>(null)

// Add in effect after readResults()
const meta = await readRunMeta(tabIdNum)
setRunMeta(meta)

// Add to return
return { results, url, loading, runId: runMeta?.runId, ranAt: runMeta?.ranAt }
```

### 2. ReportApp Component
**File:** `/v7/src/report/ReportApp.tsx`

**Line 9:** Update to get runId and ranAt
```typescript
const { results, url, loading, runId, ranAt } = useReportData()
```

**Line 50:** Pass runId and ranAt to ReportHeader
```typescript
<ReportHeader 
  url={url} 
  resultCount={results.length} 
  groupedResults={groupedResults} 
  results={results}
  runId={runId}
  ranAt={ranAt}
/>
```

### 3. ReportHeader Component
**File:** `/v7/src/report/ReportHeader.tsx`

**Add props:**
```typescript
{
  url: string
  resultCount: number
  groupedResults: Record<string, (Result & { index: number })[]>
  results: Result[]
  runId?: string              // ADD
  ranAt?: string              // ADD
}
```

**Redesign layout** to show run metadata and use proper hierarchy

---

## Key Code Locations

### Data Sources
- **RunMeta stored:** `chrome.storage.local["results-meta:{tabId}"]`
- **Results stored:** `chrome.storage.local["results:{tabId}"]`
- **Read function:** `readRunMeta(tabId)` from `@/shared/runMeta`
- **Type definition:** `RunMeta` in `/v7/src/shared/runMeta.ts`

### Side Panel Reference (Working Example)
- **File:** `/v7/src/sidepanel/ui/App.tsx`
- **Line 22:** `const runMeta = useRunMeta(resultsSource.tabId)` - Shows how to read RunMeta
- **Line 34-36:** UrlBar displays it correctly in side panel

### Utilities Available
- **Format rule names:** `formatRuleName()` @ `/v7/src/report/formatRuleName.ts`
- **Get colors:** `getResultColor()` @ `/v7/src/shared/colors.ts`
- **Sort priority:** `resultSortOrder` @ `/v7/src/shared/colors.ts`

---

## Information Hierarchy (Recommended)

### Must Show
1. Report title
2. Overall status (error/warn/ok counts with emoji)
3. Run ID
4. Timestamp (human readable)

### Should Show
1. URL tested
2. Extension version
3. Duration
4. Rules scope

### Nice to Have
1. Chrome version
2. Events captured
3. Export buttons

---

## Testing Checklist

After implementing fixes:

- [ ] useReportData returns runId and ranAt
- [ ] ReportApp passes them to ReportHeader
- [ ] ReportHeader displays run ID
- [ ] ReportHeader displays timestamp
- [ ] Timestamp is human-readable (not ISO)
- [ ] Report is self-contained (doesn't need side panel)
- [ ] Layout works on narrow screens
- [ ] Export buttons still functional
- [ ] URL is clickable (if possible in report context)

---

## Information Duplication Decision

### Currently Duplicate
- **Result counts:** Shown in ResultBadges (header) and ReportSection headers
- **Option A:** Keep both (different contexts)
- **Option B:** Remove ResultBadges section header counts (avoid duplication)

**Recommendation:** Keep both for now - different visual purposes

---

## Absolute Minimum Fix

To unblock header redesign, these 3 changes are critical:

1. Read RunMeta in useReportData() hook
2. Pass runId and ranAt to ReportHeader component  
3. Update ReportHeader type props to include runId and ranAt

Then redesign can start with actual data available.

---

## Related Comparison

### How Side Panel Does It (Correct)
```typescript
// App.tsx line 22
const runMeta = useRunMeta(resultsSource.tabId)

// App.tsx line 59
d={{ url: displayUrl, stale: showRestricted, ranAt: runMeta?.ranAt, runId: runMeta?.runId }}

// Passed to UrlBar which displays it
```

### How Report Should Do It (Currently Missing)
```typescript
// ReportApp.tsx - SHOULD BE:
const { results, url, loading, runId, ranAt } = useReportData()

// Then pass to ReportHeader
<ReportHeader runId={runId} ranAt={ranAt} {...otherProps} />

// ReportHeader renders it
```

---

## Component Dependencies

```
ReportApp (needs fixing)
  ├─ useReportData (needs fixing)
  │   └─ readResults ✓
  │   └─ readRunMeta ✗ MISSING
  └─ ReportHeader (needs redesign)
      ├─ ResultBadges ✓ (optional: remove?)
      ├─ ExportButtons ✓
      └─ (new section for run metadata)
```

---

This is everything needed to understand the problem and fix it.

