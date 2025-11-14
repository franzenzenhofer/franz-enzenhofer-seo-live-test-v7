# Report UI - Complete Data Flow Diagram

## Data Journey: From Test Execution to Report Display

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: TEST EXECUTION (background/rules/runner.ts)                  │
└─────────────────────────────────────────────────────────────────────────┘

  runner.ts:11
  ├─ Generate Run ID
  │  └─ runId = `run-${Date.now()}-${Math.random()}`
  │     Example: "run-1731605445123-a1b2c3d4"
  │
  ├─ Capture Timestamp
  │  └─ runTimestamp = new Date()
  │     Example: 2025-11-14T15:30:45.123Z
  │
  ├─ Capture Page URL
  │  └─ pageUrl = derivePageUrl(events)
  │     Example: "https://example.com"
  │
  └─ Execute Rules (via offscreen)
     └─ Get Results[] array

  runner.ts:62
  └─ writeRunMeta(tabId, {
       url: pageUrl,
       ranAt: runTimestamp.toISOString(),
       runId: runId
     })


┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: STORAGE PERSISTENCE                                          │
└─────────────────────────────────────────────────────────────────────────┘

  chrome.storage.local
  ├─ Key: "results-meta:{tabId}"
  │  └─ Value: {
  │      url: "https://example.com",
  │      ranAt: "2025-11-14T15:30:45.123Z",
  │      runId: "run-1731605445123-a1b2c3d4"
  │    }
  │
  └─ Key: "results:{tabId}"
     └─ Value: Result[]
        └─ [{
             name: "mobileFriendly",
             label: "Mobile Friendly",
             message: "...",
             type: "error",
             ...
           }, ...]


┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: SIDE PANEL READS DATA (Works ✓)                              │
└─────────────────────────────────────────────────────────────────────────┘

  sidepanel/ui/App.tsx:22
  ├─ const runMeta = useRunMeta(resultsSource.tabId)
  │  └─ Reads from chrome.storage.local["results-meta:{tabId}"]
  │     ✓ Gets: url, ranAt, runId
  │
  └─ const resultsSource = useResultsSource()
     └─ Reads from chrome.storage.local["results:{tabId}"]
        ✓ Gets: Result[]

  sidepanel/ui/App.tsx:59
  ├─ Passes to AppBody as:
  │  d={{
  │    url: displayUrl,
  │    stale: showRestricted,
  │    ranAt: runMeta?.ranAt,          ← ✓ Available
  │    runId: runMeta?.runId           ← ✓ Available
  │  }}
  │
  └─ Passed to UrlBar

  sidepanel/ui/UrlBar.tsx:34-36
  └─ Displays in side panel:
     "Run #run-1731605445123-a1b2c3d4 · Nov 14, 2025 3:30 PM"
     ✓ Users see run metadata here


┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: USER OPENS REPORT                                            │
└─────────────────────────────────────────────────────────────────────────┘

  User clicks "Show full report" button
  ↓
  chrome.tabs.create({
    url: "src/report.html?tabId={tabId}"
  })
  ↓
  Report tab opens


┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: REPORT READS DATA (BROKEN ✗)                                 │
└─────────────────────────────────────────────────────────────────────────┘

  src/report/main.tsx
  └─ Renders ReportApp

  report/ReportApp.tsx:8-9
  ├─ Extract tabId from URL
  │  const params = new URLSearchParams(window.location.search)
  │  const tabId = params.get('tabId')  ✓ Works
  │
  └─ Call useReportData()
     return { results, url, loading }

  report/useReportData.ts (NEEDS FIX)
  ├─ readResults(tabId)
  │  ✓ Gets results from storage
  │
  ├─ readRunMeta(tabId)     ✗ CURRENTLY NOT CALLED
  │  ✗ NOT getting run metadata
  │
  └─ return { results, url, loading }
     ✗ MISSING: runId, ranAt


┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: REPORT RENDERS HEADER (INCOMPLETE ✗)                         │
└─────────────────────────────────────────────────────────────────────────┘

  report/ReportApp.tsx:50
  ├─ Pass to ReportHeader:
  │  <ReportHeader
  │    url={url}                    ✓ Has it
  │    resultCount={results.length} ✓ Has it
  │    groupedResults={...}         ✓ Has it
  │    results={results}            ✓ Has it
  │    runId={runId}                ✗ MISSING
  │    ranAt={ranAt}                ✗ MISSING
  │  />
  │
  └─ ReportHeader receives:
     ✓ url, resultCount, groupedResults, results
     ✗ NO runId, NO ranAt

  report/ReportHeader.tsx:23-38
  └─ Renders:
     │ Live Test Report v0.1.54
     │ https://example.com/page
     │ [error: 5] [warn: 3] [info: 2] [ok: 1]  Total: 11
     │ [Copy JSON] [Copy HTML]
     │
     ✗ MISSING: Run ID
     ✗ MISSING: Timestamp
     ✗ MISSING: When test ran


┌─────────────────────────────────────────────────────────────────────────┐
│ COMPARISON: Data Available vs. Displayed                              │
└─────────────────────────────────────────────────────────────────────────┘

  In Storage:
  ├─ url: "https://example.com"
  ├─ ranAt: "2025-11-14T15:30:45.123Z"
  └─ runId: "run-1731605445123-a1b2c3d4"

  Side Panel Shows:
  ├─ URL ✓
  ├─ Timestamp ✓ ("Nov 14, 2025 3:30 PM")
  └─ Run ID ✓ ("Run #run-1731605445123-a1b2c3d4")

  Report Shows:
  ├─ URL ✓
  ├─ Timestamp ✗
  └─ Run ID ✗


┌─────────────────────────────────────────────────────────────────────────┐
│ THE FIX: Required Changes                                             │
└─────────────────────────────────────────────────────────────────────────┘

  Step 1: Update useReportData() Hook
  ─────────────────────────────────────
  report/useReportData.ts

    Add import:
    import { readRunMeta } from '@/shared/runMeta'
    
    Add state:
    const [runMeta, setRunMeta] = useState<RunMeta | null>(null)
    
    Add to effect:
    const meta = await readRunMeta(tabIdNum)
    setRunMeta(meta)
    
    Update return:
    return {
      results,
      url,
      loading,
      runId: runMeta?.runId,      ← NEW
      ranAt: runMeta?.ranAt       ← NEW
    }

  Step 2: Update ReportApp Component
  ──────────────────────────────────
  report/ReportApp.tsx:9

    From:
    const { results, url, loading } = useReportData()
    
    To:
    const { results, url, loading, runId, ranAt } = useReportData()

  Step 2b: Pass to ReportHeader
  ───────────────────────────────
  report/ReportApp.tsx:50

    From:
    <ReportHeader url={url} resultCount={results.length} ... />
    
    To:
    <ReportHeader 
      url={url} 
      resultCount={results.length} 
      groupedResults={groupedResults}
      results={results}
      runId={runId}          ← ADD
      ranAt={ranAt}          ← ADD
    />

  Step 3: Update ReportHeader Props
  ──────────────────────────────────
  report/ReportHeader.tsx:6-16

    From:
    {
      url: string
      resultCount: number
      groupedResults: Record<...>
      results: Result[]
    }
    
    To:
    {
      url: string
      resultCount: number
      groupedResults: Record<...>
      results: Result[]
      runId?: string         ← ADD
      ranAt?: string         ← ADD
    }

  Step 4: Redesign Header Layout
  ──────────────────────────────
  report/ReportHeader.tsx:23-39
  
    Add rendering of runId and ranAt with proper formatting
    Reorganize layout into sections
    Make timestamp human-readable


┌─────────────────────────────────────────────────────────────────────────┐
│ AFTER FIX: Data Flow Works                                            │
└─────────────────────────────────────────────────────────────────────────┘

  runner.ts
  ├─ Captures: url, ranAt, runId ✓
  └─ Writes to storage ✓

  Storage
  ├─ "results-meta:{tabId}" contains: {url, ranAt, runId} ✓
  └─ "results:{tabId}" contains: Result[] ✓

  useReportData() hook
  ├─ Reads results ✓
  ├─ Reads RunMeta ✓
  └─ Returns all data ✓

  ReportApp
  ├─ Gets runId, ranAt from hook ✓
  └─ Passes to ReportHeader ✓

  ReportHeader
  ├─ Receives runId, ranAt ✓
  └─ Displays run metadata ✓

  User sees in report:
  ├─ Test title ✓
  ├─ URL ✓
  ├─ Result counts ✓
  ├─ Run ID ✓
  ├─ Timestamp ✓
  └─ Export buttons ✓


┌─────────────────────────────────────────────────────────────────────────┐
│ BENEFITS AFTER FIX                                                    │
└─────────────────────────────────────────────────────────────────────────┘

  ✓ Report is self-contained (doesn't need side panel data)
  ✓ Users can identify which run a report represents
  ✓ Clear indication of when test was run
  ✓ Can correlation multiple test runs by Run ID
  ✓ Better information hierarchy with metadata
  ✓ Matches data available in storage
  ✓ Consistent with side panel display
  ✓ Enables proper header redesign

