# Enhanced Reporting System - Deep Inspection UX

## 🎯 Mission: Rich, Debuggable Reports Like v2

### Problem Statement
**v2 (Manifest v2)** provided deep inspection capabilities:
- Inline HTML snippets with `</> View Source` buttons
- Raw HTTP headers visible in results
- Actual DOM elements accessible for debugging
- Perfect for testers, debuggers, and power users

**v7 (Manifest v3)** is currently too shallow:
- Generic text messages only
- No access to raw HTML/headers
- Limited debugging capabilities
- Poor tester/developer experience

## 🏗️ Architecture: Two-Layer Reporting

### Layer 1: Quick View (Inline)
**Context**: Sidepanel + Report page
**Purpose**: Fast scanning, immediate context
**Content**:
- Short actionable message
- Key metrics visible inline (60 chars, HTTP 200, etc.)
- Mini code snippet (first 100 chars, monospace)
- Quick actions: `</>` View Full Source, 🔍 Highlight

**Example**:
```
[🟢 OK] HEAD - Title Tag                            </>
Title: "SEO Live Test - Best Tool..."  (60 chars)
<title>SEO Live Test - Best...</title>
```

### Layer 2: Deep Detail View (Full Page)
**Context**: Report page with anchor navigation
**Purpose**: Complete inspection, debugging, raw data
**Content**:
- Full HTML source (complete outerHTML)
- Raw HTTP headers (request + response)
- Complete metadata (all extracted data)
- DOM path with copy button
- Issues + Recommendations expanded
- Copy buttons for everything

**Example**:
```
┌─────────────────────────────────────────┐
│ 🟢 HEAD - Title Tag Analysis            │
│ ───────────────────────────────────────  │
│                                          │
│ 📝 Full HTML Source          [Copy]     │
│ ┌──────────────────────────────────┐   │
│ │ <title>SEO Live Test - Best      │   │
│ │   Tool for Testing</title>       │   │
│ └──────────────────────────────────┘   │
│                                          │
│ 📊 Analysis                              │
│ • Length: 60 characters ✅               │
│ • Word count: 8 words                    │
│ • Unique words: 7                        │
│ • Contains separators: Yes ✅            │
│                                          │
│ 🔍 DOM Location              [Copy]     │
│ head > title:nth-of-type(1)             │
│                                          │
│ ⚡ HTTP Headers (for HEAD)   [Copy]     │
│ GET / HTTP/1.1                          │
│ Host: example.com                        │
│ ...                                      │
│                                          │
│ ✅ Recommendations                       │
│ • Good use of separators for branding   │
│ • Consider A/B testing with brand first │
└─────────────────────────────────────────┘
```

## 📐 Data Structure

```typescript
interface EnhancedResultData {
  // Core (existing)
  label: string
  message: string
  type: 'ok' | 'warn' | 'error' | 'info'
  what?: string
  priority?: number

  // Quick view enhancements
  quickInfo?: string[]      // ["60 chars", "1 H1", "HTTP 200"]
  snippet?: string          // First 100 chars of HTML

  // Deep detail data
  sourceHtml?: string       // Complete outerHTML
  httpHeaders?: {           // Raw HTTP headers
    request?: Record<string, string>
    response?: Record<string, string>
  }
  domPath?: string          // CSS selector path
  rawData?: any             // Original objects (robots.txt, etc.)

  // Actions
  highlightSelector?: string  // For highlight button
  scrollToSelector?: string   // Auto-scroll in detail view

  // Metadata (existing enhanced-results.ts)
  details?: {
    title?: string
    titleLength?: number
    description?: string
    // ... all existing fields
  }
}
```

## 🔄 User Flow Mapping

### Current Flow (v7)
1. User opens sidepanel → sees results list
2. Clicks result → opens NEW tab with report page
3. Report shows basic info in DetailsView
4. Each click = NEW tab (tab explosion!)
5. Limited debugging info available

### Future Flow (Enhanced)
1. User opens sidepanel → sees results with mini snippets
2. Quick scan: see title, snippet, key metrics inline
3. Click `</>` or result → opens/updates SINGLE detail tab
4. Detail tab shows:
   - Anchor navigation to specific result
   - Full HTML source with syntax highlighting
   - Complete HTTP headers
   - All metadata
   - Copy buttons everywhere
5. Tab reuse: clicking another result updates same tab

## 🛠️ Implementation Plan

### Phase 1: Shared Utilities (Super DRY!)
**Location**: `v7/src/shared/`

1. **html-utils.ts** (≤50 lines)
   - `extractSnippet(html: string, maxChars = 100): string`
   - `nodeToHtml(node: Element | NodeList): string`
   - `getDomPath(element: Element): string`

2. **http-utils.ts** (≤50 lines)
   - `formatHeaders(headers: Record<string, string>): string`
   - `parseRawHeaders(raw: string): Record<string, string>`

3. **code-link.ts** (≤50 lines)
   - `createCodeLink(html: string, anchor: string): string`
   - `createHighlightAction(selector: string): string`

4. **tab-manager.ts** (≤50 lines)
   - `openOrUpdateDetailTab(tabId, index): Promise<void>`
   - Track detail tab ID to reuse

### Phase 2: Type Enhancements
**Location**: `v7/src/shared/enhanced-results.ts`

Extend `EnhancedResult` interface with:
- `snippet?: string`
- `sourceHtml?: string`
- `httpHeaders?: { request, response }`
- `domPath?: string`
- `rawData?: any`

### Phase 3: Component Updates

**ResultItem.tsx** (≤50 lines)
- Show mini snippet in monospace
- Add `</>` button (inline, small)
- Show quickInfo array as badges

**ReportSection.tsx** (≤50 lines)
- Display snippet if available
- Add expand/collapse for long content
- Show key metrics inline

**DetailViewFull.tsx** (NEW, ≤75 lines)
- Replace simple DetailsView
- Full page layout with sections
- Copy buttons
- Syntax highlighting for HTML

### Phase 4: Tab Management
**ResultItem.tsx** click handler:
- Check if detail tab exists
- If yes: update with new anchor
- If no: create new tab, track ID
- Store tab ID in session storage

### Phase 5: Rule Migration (One by One)

**Priority Order** (based on old v2 usage):
1. ✅ **title-enhanced.ts** - Add sourceHtml
2. ✅ **metaDescription-enhanced.ts** - Add sourceHtml
3. ✅ **h1-enhanced.ts** - Add sourceHtml + all H1s
4. ✅ **HTTP status** - Add httpHeaders
5. ✅ **robots.txt** - Add rawData (full robots.txt)
6. ✅ **canonical** - Add sourceHtml
7. ✅ **hreflang** - Add sourceHtml + all links
8. ... continue for all 50+ rules

**For Each Rule**:
1. Check old v2 implementation (`f19n-obtrusive-livetest/src/public/default-rules/*.js`)
2. Identify what raw data was shown
3. Extract element HTML with `nodeToHtml()`
4. Add snippet with `extractSnippet()`
5. Store complete HTML in `sourceHtml`
6. Add DOM path with `getDomPath()`
7. Test in UI
8. Atomic commit!

## 📋 Code Standards

### DRY Principles
- ❌ NO duplicate HTML extraction code
- ❌ NO duplicate snippet generation
- ❌ NO duplicate DOM path generation
- ✅ ONE utility function per operation
- ✅ Import and reuse everywhere

### Modularity
- Each utility: ≤50 lines
- Each component: ≤50 lines (≤75 for complex ones)
- One responsibility per file
- Clear imports/exports

### Testing Strategy
- Unit test each utility function
- Test snippet extraction with long HTML
- Test DOM path generation accuracy
- Test tab reuse behavior
- Manual QA with real pages

## 🎨 UI/UX Guidelines

### Quick View Design
- Snippet: `font-mono text-xs bg-gray-100 p-1 rounded`
- `</>` button: Small, inline, clear hover state
- Badges: Color-coded by metric type
- Truncate long content with "..."

### Detail View Design
- Sections clearly separated
- Copy buttons: Top-right of each block
- Syntax highlighting: VS Code theme
- Monospace fonts for code
- Collapsible sections for long content

### Accessibility
- Copy buttons have aria-labels
- Keyboard navigation works
- Screen reader friendly
- High contrast for code blocks

## 🚀 Success Metrics

### User Experience
- ✅ Testers can see raw HTML in 1 click
- ✅ Debuggers can inspect HTTP headers
- ✅ No tab explosion (single detail tab)
- ✅ Fast scanning with inline snippets
- ✅ Deep diving with full source view

### Developer Experience
- ✅ Adding sourceHtml to new rule = 3 lines of code
- ✅ All utilities fully typed
- ✅ Zero code duplication
- ✅ Clear migration path for remaining rules

### Performance
- ✅ Snippet extraction: <5ms
- ✅ DOM path generation: <10ms
- ✅ Detail view render: <100ms
- ✅ No memory leaks from tab management

## 📚 References

### Old v2 Code to Study
- `f19n-obtrusive-livetest/src/javascripts/utils/RuleContext.js`
  - `partialCodeLink()` - The key function!
  - `nodeToString()` - HTML extraction
  - `utf8TextLink()` - Code view links

- `f19n-obtrusive-livetest/src/public/default-rules/`
  - `static-head-title.js` - Example with `this.partialCodeLink(titletags)`
  - `http-status-code.js` - Example with `this.partialCodeLink(rawHttpHeader)`

### New v7 Code to Enhance
- `v7/src/shared/enhanced-results.ts` - Type definitions
- `v7/src/rules/head/title-enhanced.ts` - First rule to migrate
- `v7/src/report/DetailsView.tsx` - Replace with DetailViewFull
- `v7/src/sidepanel/ui/ResultItem.tsx` - Add snippet display

---

## 🎯 Next Steps

1. ✅ Create this README
2. ✅ Reference in v7/CLAUDE.md
3. ✅ Create shared utilities
4. ✅ Enhance type definitions
5. ✅ Update components
6. ✅ Implement tab reuse
7. ✅ Migrate rules one by one
8. ✅ Test complete flow
9. ✅ Ship it!

**Remember**: Atomic commits after every file change! 🚀