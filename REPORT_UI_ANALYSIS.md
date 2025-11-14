# Report UI Information Architecture Analysis

## Overview
The report UI displays test results with a clear information hierarchy, but there are critical pieces of metadata that are NOT being passed to or displayed in the report header, creating a disconnect between what's available and what's shown.

---

## 1. DATA AVAILABLE FOR DISPLAY

### A. Result Data (Available)
Each `Result` object contains:
```typescript
type Result = {
  name: string              // Machine readable name (e.g., "mobileFriendly")
  label: string             // Human readable label (e.g., "Mobile Friendly")
  message: string           // Main message for the result
  type: string              // 'error', 'warn', 'info', 'ok'
  what?: string | null      // Additional formatted name (optional)
  ruleId?: string | null    // Rule identifier
  priority?: number         // Priority number (optional)
  details?: {               // Extended details object
    sourceHtml?: string     // HTML snippet
    snippet?: string        // First 100 chars for preview
    domPath?: string        // CSS selector path
    [key: string]: unknown  // Other custom fields
  }
}
```

### B. Run Metadata (AVAILABLE but NOT PASSED TO REPORT)
```typescript
type RunMeta = {
  url: string              // The URL tested
  ranAt: string            // ISO timestamp of when run executed
  runId: string            // Unique identifier (run-{timestamp}-{random})
}
```

**Location:** Stored in `chrome.storage.local` under key `results-meta:{tabId}`
**Written by:** `src/background/rules/runner.ts` at line 62
**Data available during:** Report generation (in the browser when report tab opens)

### C. Execution Context (CAPTURED but NOT EXPOSED)
In `runner.ts` globals passed to offscreen execution:
```typescript
const globals = {
  variables: globalRuleVariables,
  googleApiAccessToken,
  events: run.ev,                    // Navigation/request events
  rulesUrl: chrome.runtime.getURL(...),
  codeviewUrl: chrome.runtime.getURL(...),
  runId,                             // Unique run identifier
  runTimestamp: runTimestamp.toISOString()
}
```

**Additional context available but not persisted:**
- `run.ev.length` - Number of events captured (navs, requests, DOM snapshots)
- `navs` count - Number of navigation events
- `reqs` count - Number of request events
- HTML size in bytes
- First and last URLs
- Enabled rules count and their names

---

## 2. CURRENT VISUAL STRUCTURE

### ReportApp.tsx Structure
```
ReportApp
├── ReportHeader
│   ├── Title: "Live Test Report v{version}"
│   ├── URL Display
│   ├── ResultBadges (from ResultBadges.tsx)
│   │   └── Shows badge for each type with count:
│   │       error: N | warn: N | info: N | ok: N
│   ├── Total Count Badge
│   └── ExportButtons
│       ├── "Copy JSON"
│       └── "Copy HTML"
└── ResultSections (grouped by type)
    ├── ERROR (N items)
    │   └── ResultCard x N
    ├── WARN (N items)
    │   └── ResultCard x N
    ├── INFO (N items)
    │   └── ResultCard x N
    └── OK (N items)
        └── ResultCard x N
```

### ReportHeader Current Props (line 50)
```typescript
<ReportHeader 
  url={url}              // URL being tested
  resultCount={results.length}  // Total results
  groupedResults={groupedResults}  // Results grouped by type
  results={results}      // All results array
/>
```

**MISSING:** No `runMeta` prop - metadata not passed from ReportApp

---

## 3. INFORMATION HIERARCHY PROBLEMS

### Problem 1: Missing Run Metadata
**Current State:**
- ReportHeader has NO access to `runMeta` data
- Run ID is not displayed
- Run timestamp is not displayed
- No indication of when test was run relative to now

**Where it IS shown:**
- Side Panel (UrlBar.tsx, line 34-36) displays: "Run #{runId} · {formatted timestamp}"
- Side Panel uses `useRunMeta` hook to get this data

**Data Flow Gap:**
```
runner.ts writes RunMeta to storage
  ↓
Side Panel reads it via useRunMeta()
  ↓
Side Panel passes ranAt & runId to UrlBar
  ↓
REPORT opens but doesn't read RunMeta
  ↓
ReportHeader cannot access this data
```

### Problem 2: Duplicate Information Across UI Layers
- **URL shown twice:**
  - In ReportHeader (line 29)
  - In Side Panel UrlBar (line 22)
  
- **Result counts shown twice:**
  - In ReportHeader ResultBadges
  - In ReportSection headers
  
- **Metadata shown in Side Panel but not Report:**
  - Run ID: Shown in side panel, not in report
  - Timestamp: Shown in side panel, not in report

### Problem 3: No Execution Context Information
The report provides NO metadata about:
1. How many rules were executed (total enabled rules count)
2. How long the test took (start time vs. end time)
3. How many events were captured (navigation, requests, DOM snapshots)
4. Browser profiling data (if captured)
5. Test execution status (success, partial, error)
6. Memory/performance of the test run itself

### Problem 4: Visual Hierarchy Issues
**Current layout (line 28-38):**
```
[Title with version] 
[URL] [Badges] [Total] [Buttons]  ← All on one line, wrapped
```

**Problems:**
1. URL can be very long (wraps)
2. Badges + Total + Buttons crowd on narrow screens
3. Version is shown with title but is tiny
4. No separation between "what was tested" and "results summary"
5. Run metadata not shown at all

---

## 4. MISSING INFORMATION NOT BEING DISPLAYED

### High Priority (Execution Metadata)
- Run ID (tracked, available, shown in side panel but NOT in report)
- Run timestamp (tracked, available, shown in side panel but NOT in report)
- Test duration / Execution time
- Total rules executed (count)
- Total rules enabled

### Medium Priority (Context)
- Environment info (Chrome version)
- Test mode (if applicable)
- Rules version/configuration state
- Network conditions

### Low Priority (Debugging)
- Event counts (navs, requests, DOM snapshots)
- HTML size captured
- First and last URLs detected
- API integrations used

---

## 5. INFORMATION DUPLICATION ANALYSIS

### Result Type Counts
**Shown in 2 places:**
1. ResultBadges component (ReportHeader, line 31) 
   - Shows: "error: 5 warn: 3 info: 2 ok: 1"
2. ReportSection headers (ReportSection.tsx, line 12)
   - Shows: "ERROR (5)" "WARN (3)" etc.

**Rationale:**
- ReportHeader badges: Quick overview, high level
- ReportSection headers: Contextual label for each section
- This is GOOD duplication (serves different purposes)

### URL Display
**Shown in 2 places:**
1. ReportHeader (line 29)
2. UrlBar in side panel

**Rationale:**
- Report should be self-contained (doesn't reference side panel)
- Side panel shows for interactive testing
- Side panel UrlBar has action buttons (Copy, Open)
- This is NECESSARY duplication (different contexts)

---

## 6. DATA FLOW ARCHITECTURE

### Current Data Flow
```
Background (runner.ts)
  ├─ Captures URL, timestamp, runId
  ├─ Writes to chrome.storage.local under "results-meta:{tabId}"
  ├─ Writes results to "results:{tabId}"
  └─ Logs to "logs:{tabId}"

Side Panel (App.tsx)
  ├─ Reads results via useResultsSource()
  ├─ Reads metadata via useRunMeta()
  ├─ Displays both in UrlBar and AppBody
  └─ Opens report via chrome.tabs.create()

Report (ReportApp.tsx)
  ├─ Gets tabId from URL params
  ├─ Reads results via useReportData()
  ├─ DOES NOT read RunMeta
  ├─ Passes to ReportHeader
  └─ ReportHeader has NO access to runId, ranAt
```

### Missing Connection
```
ReportApp should:
  1. Extract tabId from URL params ✓ (done in useReportData)
  2. Read results from storage ✓ (done)
  3. Read RunMeta from storage ✗ (NOT done)
  4. Pass to ReportHeader ✗ (structure doesn't support it)
  5. Display in header ✗ (not rendered)
```

---

## 7. COMPONENT STRUCTURE AND PROPS

### ReportHeader Props (Current)
```typescript
{
  url: string
  resultCount: number
  groupedResults: Record<string, (Result & { index: number })[]>
  results: Result[]
}
```

**What's Missing:**
```typescript
// Should add:
runId?: string
ranAt?: string
totalRulesEnabled?: number
testDuration?: number
```

### ReportApp Props Flow
```
ReportApp (line 50)
  └─→ ReportHeader
        ├─ url ✓
        ├─ resultCount ✓
        ├─ groupedResults ✓
        ├─ results ✓
        ├─ runId ✗ NOT PASSED
        ├─ ranAt ✗ NOT PASSED
        └─ (other metadata) ✗
```

---

## 8. FORMATTING UTILITIES AVAILABLE

### formatRuleName(item)
Located: `src/report/formatRuleName.ts`
```typescript
// Returns formatted rule name:
// 1. If item.what exists, return it (user-friendly override)
// 2. If item.name exists, convert camelCase to "Title Case"
// 3. Otherwise return empty string
```

### Available Color System
Located: `src/shared/colors.ts`
- `getResultColor(type)` - Returns themed colors for each result type
- `resultSortOrder` - Defines sort priority (error=0, warn=1, info=2, ok=3)
- Color properties: `bg`, `border`, `text`, `dot`, `badge`, `full`

---

## 9. SUMMARY OF ISSUES

| Issue | Current Behavior | Impact | Where to Fix |
|-------|-----------------|--------|--------------|
| No run metadata in report | RunMeta exists in storage but isn't read/displayed | Users don't know when test was run or which run it was | useReportData, ReportHeader |
| Metadata passed but not rendered | ReportHeader receives results but no runId/ranAt | Header incomplete | ReportHeader rendering |
| No execution timing | Start/end times tracked internally but not persisted | No indication of test duration | runner.ts (persist) + report display |
| No rules count | Rules executed internally but count not exposed | Missing context about test scope | Need to track in RunMeta |
| Poor visual hierarchy | URL wraps, badges crowd, metadata missing | Confusing on narrow screens | ReportHeader layout |
| Information island | Side panel and report don't share metadata | Users see different info in each view | Fix data flow |

---

## 10. RECOMMENDED INFORMATION HIERARCHY FOR REDESIGN

### Tier 1 (Essential, Always Show)
- **Title**: Report for [Domain]
- **Overall Status**: ✗ {N} errors | ⚠ {N} warnings | ✓ {N} passed
- **Run ID**: #run-{timestamp}
- **Timestamp**: Ran on {date} at {time} ({human readable})

### Tier 2 (Important, Visible But Secondary)
- **Full URL**: [clickable link]
- **Version**: Extension v{X.Y.Z}
- **Duration**: Test took {X.Xs}
- **Rules**: {N} active rules tested

### Tier 3 (Context, Collapsible/Expandable)
- **Chrome Version**: {version}
- **Events Captured**: {N} navigations, {N} requests, {N} DOM snapshots
- **API Integrations**: Google APIs enabled, etc.
- **Export Options**: Copy JSON, Copy HTML

---

## Data Available in RunMeta Object

The `RunMeta` object is stored in Chrome storage and contains exactly what's needed:

```typescript
{
  url: "https://example.com",           // The page tested
  ranAt: "2025-11-14T15:30:45.123Z",    // ISO timestamp
  runId: "run-1731605445123-a1b2c3d4"   // Unique identifier
}
```

**Availability:**
- Stored by: `writeRunMeta()` in runner.ts:62
- Read by: `readRunMeta()` / `readLastRunMeta()` 
- Watch by: `watchRunMeta()` for real-time updates
- Currently used in: Side panel UrlBar component
- NOT used in: Report components

