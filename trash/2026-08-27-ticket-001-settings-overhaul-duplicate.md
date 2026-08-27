# TICKET-001: Settings Panel Overhaul

**Status:** Superseded by completed `tickets/closed/TICKET-001-settings-overhaul.md` (2026-08-27)
**Priority:** HIGH
**Effort:** 3-4 days
**Type:** Feature Enhancement
**Principle:** KISS + DRY - No Dead Code!

> Archived duplicate plan. Moved to `trash/` on 2026-08-27 because the canonical ticket is complete.

---

## Problem Statement

The current settings panel has critical usability and **CODE DUPLICATION** issues:

### 🔴 CRITICAL Issues

1. **Massive Code Duplication (NOT DRY!)**
   ```
   Settings Page              Sidepanel                Result
   ────────────────          ─────────────────        ──────────────────
   useSettings.ts      →     AutoRun.tsx             DUPLICATE LOGIC!
   (loads ui:autoRun)        (loads ui:autoRun)      NO SYNC!

   GeneralSettings.tsx →     PreserveLog.tsx         DUPLICATE LOGIC!
   (manages preserveLog)     (manages preserveLog)   NO SYNC!
   ```

   **Impact:** Changes in settings don't reflect in sidepanel until reload!

2. **No Input Validation**
   - API keys accepted blindly → silent failures
   - GSC URL format not checked → rules fail silently
   - Users have no idea if their config works

3. **101 Rules, No Search**
   - Scrolling through massive grid is unusable
   - Can't find "canonical" or "meta-description" quickly
   - Categories exist in code but not exposed in UI

4. **No Debug Tools**
   - Can't see what's actually stored
   - Must open DevTools → Application → Storage
   - No way to backup/restore settings

5. **Poor UX**
   - No feedback when saving
   - Minimal help text
   - Auto-enable logic is confusing

---

## Solution: DRY + Simple Improvements

**Core Principle:** ONE source of truth for each setting. ZERO duplication.

### Strategy

1. **Create ONE reusable hook** → Replaces ALL duplicate storage code
2. **Delete old files** → No dead code left behind
3. **Simplify components** → Each manages its own state directly
4. **Add validation** → Catch errors before they cause problems
5. **Add search** → Find rules instantly
6. **Add debug tools** → See what's stored, export/import settings

---

## File Changes: Before → After

### ❌ FILES TO DELETE (Dead Code Removal)

```
/v7/src/settings/
├── useSettings.ts                    ❌ DELETE (41 lines)
                                         → Replaced by useStorageSetting hook
                                         → No longer needed - each component
                                           manages its own state
```

**Why delete `useSettings.ts`?**
- Loads ALL settings at once (wasteful)
- NO real-time sync (the main problem!)
- Creates prop-drilling through SettingsApp
- `useStorageSetting` hook replaces it completely

### ✅ FILES TO CREATE (New Code)

```
/v7/src/shared/
├── hooks/
│   └── useStorageSetting.ts          ✅ NEW (~40 lines)
│                                        → DRY hook for any storage key
│                                        → Real-time sync built-in
│                                        → Replaces ALL duplicate code
├── components/
│   ├── HelpText.tsx                  ✅ NEW (~30 lines)
│   └── Toast.tsx                     ✅ NEW (~50 lines)
└── validation.ts                     ✅ NEW (~50 lines)

/v7/src/settings/
├── StorageDebug.tsx                  ✅ NEW (~60 lines)
└── ImportExport.tsx                  ✅ NEW (~70 lines)
```

### 🔧 FILES TO REFACTOR (Simplify)

```
/v7/src/settings/
├── SettingsApp.tsx                   🔧 REFACTOR
│                                        BEFORE: 51 lines, orchestrates everything
│                                        AFTER: ~35 lines, just renders components
│                                        DELETE: useSettings() call
│                                        DELETE: prop drilling (updateFlags, etc.)
│
├── GeneralSettings.tsx               🔧 REFACTOR
│                                        BEFORE: Gets props from SettingsApp
│                                        AFTER: Uses useStorageSetting directly
│                                        SIMPLER: No prop drilling
│
├── ApiKeys.tsx                       🔧 REFACTOR
│                                        ADD: Validation with inline feedback
│                                        ADD: Better help text
│
└── RuleToggles.tsx                   🔧 REFACTOR
                                         ADD: Search input
                                         ADD: Category filters

/v7/src/sidepanel/ui/
├── AutoRun.tsx                       🔧 REFACTOR
│                                        BEFORE: 14 lines with duplicate storage logic
│                                        AFTER: 10 lines using useStorageSetting
│
└── PreserveLog.tsx                   🔧 REFACTOR
                                         BEFORE: 14 lines with duplicate storage logic
                                         AFTER: 10 lines using useStorageSetting
```

### 📦 FILES TO KEEP (No Changes)

```
/v7/src/settings/
├── useAuthHandlers.ts                ✓ KEEP (Auth logic, not storage)
├── ToggleRow.tsx                     ✓ KEEP (Reusable UI component)
├── GoogleAccount.tsx                 ✓ KEEP (No changes needed)
├── FavoritesManagement.tsx           ✓ KEEP (Works fine as-is)
├── main.tsx                          ✓ KEEP (Entry point)
├── settings.html                     ✓ KEEP (HTML page)
└── index.css                         ✓ KEEP (Tailwind imports)
```

---

## 1️⃣ CRITICAL: The DRY Solution

### Problem: Duplicate Storage Code Everywhere

**Current Code (DUPLICATED 6+ times!):**

```typescript
// Settings: useSettings.ts (lines 15-32)
useEffect(() => {
  chrome.storage.local.get(['ui:autoRun'], (items) => {
    setAutoRun(items['ui:autoRun'] !== false)
  })
}, [])
// ❌ NO real-time sync!

// Sidepanel: AutoRun.tsx (line 5)
useEffect(()=>{
  chrome.storage.local.get('ui:autoRun').then((v)=>
    setOn(v['ui:autoRun'] !== false)
  )
},[])
// ❌ NO real-time sync!

// Sidepanel: PreserveLog.tsx
// ❌ Same pattern duplicated AGAIN!

// SettingsApp.tsx (line 24)
const toggleSetting = (k: string, v: boolean) =>
  chrome.storage.local.set({ [k]: v })
// ❌ No state update, no sync!
```

**Result:**
- 6+ places with same logic
- Changes don't sync between contexts
- Maintenance nightmare

### Solution: ONE Hook to Rule Them All

**NEW FILE:** `/v7/src/shared/hooks/useStorageSetting.ts`

```typescript
import { useState, useEffect } from 'react'

/**
 * Hook for managing a single chrome.storage.local value with real-time sync.
 *
 * @param key - Storage key (e.g., 'ui:autoRun')
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue] - Current value and update function
 *
 * @example
 * const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)
 */
export const useStorageSetting = <T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>] => {
  const [value, setValue] = useState<T>(defaultValue)

  // Load initial value
  useEffect(() => {
    chrome.storage.local.get(key).then(result => {
      setValue(result[key] ?? defaultValue)
    })
  }, [key, defaultValue])

  // ✅ REAL-TIME SYNC: Listen for changes from ANY context!
  useEffect(() => {
    const listener = (changes: any, area: string) => {
      if (area === 'local' && changes[key]) {
        setValue(changes[key].newValue ?? defaultValue)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [key, defaultValue])

  // Update function
  const updateValue = async (newValue: T) => {
    await chrome.storage.local.set({ [key]: newValue })
    setValue(newValue)
  }

  return [value, updateValue]
}
```

**Usage (replaces ALL old code):**

```typescript
// Settings: GeneralSettings.tsx
const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)
const [autoClear, setAutoClear] = useStorageSetting('ui:autoClear', true)
const [preserveLog, setPreserveLog] = useStorageSetting('ui:preserveLog', false)

// Sidepanel: AutoRun.tsx (DELETE 10 lines, replace with 1 line!)
const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)

// Sidepanel: PreserveLog.tsx (DELETE 10 lines, replace with 1 line!)
const [preserveLog, setPreserveLog] = useStorageSetting('ui:preserveLog', false)
```

**Results:**
- ✅ Change in settings → sidepanel updates in <100ms
- ✅ Change in sidepanel → settings page updates in <100ms
- ✅ ZERO duplication
- ✅ 100+ lines of code DELETED

---

## 2️⃣ REFACTOR: Simplify SettingsApp.tsx

### Before (51 lines, complex orchestration)

```typescript
export const SettingsApp = () => {
  const state = useSettings()  // ❌ Loads everything
  const { signIn, signOut } = useAuthHandlers(state.setHasToken)

  // ❌ Wrapper functions for prop drilling
  const updateFlags = (next: Flags) => {
    state.setFlags(next)
    chrome.storage.local.set({ 'rule-flags': next })
  }
  const updateVar = (k: string) => (e) => {
    const vars = { ...state.vars, [k]: e.target.value }
    state.setVars(vars)
    chrome.storage.local.set({ globalRuleVariables: vars })
  }
  const toggleSetting = (k: string, v: boolean) =>
    chrome.storage.local.set({ [k]: v })

  // ❌ Prop drilling to every component
  return (
    <GeneralSettings
      autoRun={state.autoRun}
      setAutoRun={state.setAutoRun}
      autoClear={state.autoClear}
      // ... more props
      toggleSetting={toggleSetting}
    />
    <ApiKeys vars={state.vars} updateVar={updateVar} />
    <RuleToggles flags={state.flags} updateFlags={updateFlags} />
  )
}
```

### After (~35 lines, simple rendering)

```typescript
export const SettingsApp = () => {
  const version = chrome.runtime.getManifest().version

  // ✅ NO state management - components handle their own!
  // ✅ NO prop drilling - components use hooks directly!

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Live Test Settings <span className="text-sm text-gray-500">v{version}</span>
          </h1>
        </div>

        <div className="space-y-6">
          <GeneralSettings />
          <FavoritesManagement />
          <GoogleAccount />
          <ApiKeys />
          <RuleToggles />
          <ImportExport />
          <StorageDebug />
        </div>

        <Toast />
      </div>
    </div>
  )
}
```

**Result:**
- ✅ 16 lines shorter (51 → 35)
- ✅ No orchestration logic
- ✅ No prop drilling
- ✅ Components are self-contained

---

## 3️⃣ REFACTOR: Simplify GeneralSettings.tsx

### Before (receives props)

```typescript
export const GeneralSettings = ({
  autoRun, setAutoRun,
  autoClear, setAutoClear,
  preserveLog, setPreserveLog,
  toggleSetting
}: GeneralSettingsProps) => {
  // ❌ Props come from parent
  // ❌ toggleSetting wrapper function
  return (
    <ToggleRow
      checked={autoRun}
      onChange={(v) => {
        setAutoRun(v)
        toggleSetting('ui:autoRun', v)  // ❌ Manual storage update
      }}
    />
  )
}
```

### After (self-contained)

```typescript
export const GeneralSettings = () => {
  // ✅ Direct hook usage - NO props needed!
  const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)
  const [autoClear, setAutoClear] = useStorageSetting('ui:autoClear', true)
  const [preserveLog, setPreserveLog] = useStorageSetting('ui:preserveLog', false)

  return (
    <div className="border rounded bg-gray-50 p-4">
      <h2 className="text-lg font-semibold mb-4">General Settings</h2>

      <div className="space-y-3">
        <ToggleRow
          label="Auto Run"
          description="Automatically run tests when navigating to new pages"
          checked={autoRun}
          onChange={setAutoRun}  // ✅ Direct update - hook handles storage!
        />

        <ToggleRow
          label="Auto Clear"
          description="Clear results when navigating to new page"
          checked={autoClear}
          onChange={setAutoClear}
        />

        <ToggleRow
          label="Preserve Log"
          description="Keep logs when navigating away"
          checked={preserveLog}
          onChange={setPreserveLog}
        />
      </div>
    </div>
  )
}
```

**Result:**
- ✅ NO props needed
- ✅ Self-contained
- ✅ Real-time sync automatic
- ✅ Simpler to understand

---

## 4️⃣ REFACTOR: Simplify Sidepanel Components

### Before: AutoRun.tsx (14 lines of duplicate logic)

```typescript
export const AutoRun = () => {
  const [on, setOn] = useState(true)

  // ❌ Manual storage load
  useEffect(()=>{
    chrome.storage.local.get('ui:autoRun').then((v)=>
      setOn(v['ui:autoRun'] !== false)
    )
  },[])

  // ❌ Manual storage update, NO sync
  const toggle = async () => {
    const v = !on
    setOn(v)
    await chrome.storage.local.set({ 'ui:autoRun': v })
  }

  return (
    <label>
      <input type="checkbox" checked={on} onChange={toggle} />
      Auto‑run
    </label>
  )
}
```

### After: AutoRun.tsx (10 lines, uses hook)

```typescript
import { useStorageSetting } from '@/shared/hooks/useStorageSetting'

export const AutoRun = () => {
  // ✅ ONE line replaces 12 lines of code!
  const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)

  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={autoRun}
        onChange={(e) => setAutoRun(e.target.checked)}
      />
      Auto‑run on navigation
    </label>
  )
}
```

**Result:**
- ✅ 4 lines shorter (14 → 10)
- ✅ ZERO duplicate code
- ✅ Real-time sync with settings page
- ✅ Same pattern for PreserveLog.tsx

---

## 5️⃣ ADD: Input Validation

**NEW FILE:** `/v7/src/shared/validation.ts`

```typescript
export type ValidationResult = {
  valid: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}

export const validatePSIKey = async (key: string): Promise<ValidationResult> => {
  if (!key || key.trim() === '') {
    return { valid: true, message: 'Using default API key', type: 'warning' }
  }

  if (!key.startsWith('AIza') || key.length < 30) {
    return { valid: false, message: 'Invalid format (should start with "AIza")', type: 'error' }
  }

  try {
    const response = await fetch(
      `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://google.com&key=${key.trim()}`
    )

    if (response.ok) {
      return { valid: true, message: '✓ Valid API key', type: 'success' }
    } else if (response.status === 400) {
      return { valid: false, message: 'Invalid API key', type: 'error' }
    } else if (response.status === 429) {
      return { valid: false, message: 'Quota exceeded', type: 'error' }
    }
  } catch (err) {
    return { valid: false, message: 'Network error', type: 'error' }
  }

  return { valid: false, message: 'Unknown error', type: 'error' }
}

export const validateGSCUrl = (url: string): ValidationResult => {
  if (!url || url.trim() === '') {
    return { valid: false, message: 'Required for Search Console rules', type: 'warning' }
  }

  const httpsPattern = /^https:\/\/.+\/$/
  const scDomainPattern = /^sc-domain:.+$/

  if (httpsPattern.test(url) || scDomainPattern.test(url)) {
    return { valid: true, message: '✓ Valid format', type: 'success' }
  }

  return {
    valid: false,
    message: 'Must be "https://example.com/" or "sc-domain:example.com"',
    type: 'error'
  }
}
```

**Usage in ApiKeys.tsx:**

```typescript
const [psiValidation, setPsiValidation] = useState<ValidationResult | null>(null)

const handlePSIBlur = async () => {
  const result = await validatePSIKey(vars['google_page_speed_insights_key'])
  setPsiValidation(result)
  if (result.valid) {
    showToast('API key validated', 'success')
  }
}

// In render:
<input onBlur={handlePSIBlur} {...props} />
{psiValidation && (
  <div className={cn(
    'mt-2 text-sm p-2 rounded',
    psiValidation.type === 'success' && 'bg-green-50 text-green-700',
    psiValidation.type === 'error' && 'bg-red-50 text-red-700',
    psiValidation.type === 'warning' && 'bg-yellow-50 text-yellow-700'
  )}>
    {psiValidation.message}
  </div>
)}
```

---

## 6️⃣ ADD: Rule Search & Filtering

**REFACTOR:** `/v7/src/settings/RuleToggles.tsx`

```typescript
const [searchQuery, setSearchQuery] = useState('')
const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

const categories = [...new Set(rulesInventory.map(r => r.category))].sort()

const filteredRules = rulesInventory.filter(rule => {
  const matchesSearch = !searchQuery ||
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.id.toLowerCase().includes(searchQuery.toLowerCase())

  const matchesCategory = selectedCategories.size === 0 ||
    selectedCategories.has(rule.category)

  return matchesSearch && matchesCategory
})

return (
  <div className="border rounded bg-gray-50 p-4">
    <h2 className="text-lg font-semibold mb-4">Rule Configuration</h2>

    {/* Search */}
    <input
      type="search"
      placeholder="Search 101 rules by name or ID..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full px-4 py-2 border rounded mb-4"
    />

    {/* Category filters */}
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map(cat => {
        const count = rulesInventory.filter(r => r.category === cat).length
        const isSelected = selectedCategories.has(cat)
        return (
          <button
            key={cat}
            onClick={() => {
              const next = new Set(selectedCategories)
              isSelected ? next.delete(cat) : next.add(cat)
              setSelectedCategories(next)
            }}
            className={cn(
              'px-3 py-1 rounded-full text-sm',
              isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {cat} ({count})
          </button>
        )
      })}
    </div>

    <p className="text-sm text-gray-600 mb-3">
      Showing {filteredRules.length} of {rulesInventory.length} rules
    </p>

    {/* Rule grid */}
    <div className="grid gap-2 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
      {filteredRules.map(rule => (
        // ... existing rule rendering
      ))}
    </div>
  </div>
)
```

---

## 7️⃣ ADD: Storage Inspector & Import/Export

**NEW FILE:** `/v7/src/settings/StorageDebug.tsx` (~60 lines)
**NEW FILE:** `/v7/src/settings/ImportExport.tsx` (~70 lines)

See full implementation in original ticket (keeping this section short for brevity).

---

## Implementation Plan

### Day 1: DRY Foundation (CRITICAL!)

**MORNING:**
- [ ] Create `/v7/src/shared/hooks/useStorageSetting.ts`
- [ ] Write tests for hook
- [ ] Verify real-time sync works

**AFTERNOON:**
- [ ] Refactor `GeneralSettings.tsx` to use hook
- [ ] Refactor `AutoRun.tsx` to use hook
- [ ] Refactor `PreserveLog.tsx` to use hook
- [ ] **DELETE** `/v7/src/settings/useSettings.ts` ❌
- [ ] Refactor `SettingsApp.tsx` (remove orchestration)
- [ ] Test sync between settings and sidepanel
- [ ] Commit: `refactor(settings): eliminate duplication with shared hook`

**RESULT:** Zero duplicate code, real-time sync working

---

### Day 2: Validation & Feedback

- [ ] Create `/v7/src/shared/validation.ts`
- [ ] Create `/v7/src/shared/components/Toast.tsx`
- [ ] Add validation to `ApiKeys.tsx`
- [ ] Add toast notifications to all settings
- [ ] Test validation with real API keys
- [ ] Commit: `feat(settings): add validation and user feedback`

**RESULT:** Users know immediately if config works

---

### Day 3: Usability

- [ ] Add search to `RuleToggles.tsx`
- [ ] Add category filters to `RuleToggles.tsx`
- [ ] Create `/v7/src/shared/components/HelpText.tsx`
- [ ] Improve help text in all components
- [ ] Test search/filter with 101 rules
- [ ] Commit: `feat(settings): add rule search and improved help`

**RESULT:** Find any rule in <5 seconds

---

### Day 4: Debug & Backup

- [ ] Create `/v7/src/settings/StorageDebug.tsx`
- [ ] Create `/v7/src/settings/ImportExport.tsx`
- [ ] Add components to `SettingsApp.tsx`
- [ ] Test export/import flow
- [ ] Test storage inspector
- [ ] Commit: `feat(settings): add inspector and backup/restore`

**RESULT:** Full visibility into stored data

---

### Day 5: Testing & Polish

- [ ] Run full test suite
- [ ] Test all sync scenarios
- [ ] Test validation edge cases
- [ ] Test import/export with real data
- [ ] Fix any bugs found
- [ ] Update documentation
- [ ] Commit: `test(settings): comprehensive testing and bug fixes`

**RESULT:** Production-ready code

---

## Code Deletion Summary

### Lines Deleted
```
useSettings.ts                41 lines    ❌ DELETED
AutoRun.tsx duplicate code    ~10 lines   ✂️ SIMPLIFIED
PreserveLog.tsx duplicate     ~10 lines   ✂️ SIMPLIFIED
SettingsApp.tsx orchestration ~16 lines   ✂️ SIMPLIFIED
GeneralSettings.tsx props     ~8 lines    ✂️ SIMPLIFIED
────────────────────────────────────────
TOTAL DELETED:                ~85 lines
```

### Lines Added
```
useStorageSetting.ts          40 lines    ✅ NEW
validation.ts                 50 lines    ✅ NEW
Toast.tsx                     50 lines    ✅ NEW
HelpText.tsx                  30 lines    ✅ NEW
StorageDebug.tsx              60 lines    ✅ NEW
ImportExport.tsx              70 lines    ✅ NEW
RuleToggles search/filter     ~30 lines   ✅ ADDED
ApiKeys validation UI         ~20 lines   ✅ ADDED
────────────────────────────────────────
TOTAL ADDED:                  ~350 lines
```

### Net Change
```
Added:    ~350 lines (new features)
Deleted:  ~85 lines (duplication, dead code)
Net:      +265 lines (15% increase for 7 major features!)
```

---

## Success Criteria

### Functionality
- ✅ Change setting in settings page → sidepanel updates in <100ms
- ✅ Change setting in sidepanel → settings page updates in <100ms
- ✅ Open settings in 2 tabs → changes sync between them
- ✅ **NO duplicate code** - grep for storage patterns finds ONLY useStorageSetting
- ✅ PSI key validation catches invalid keys before use
- ✅ Find any rule by typing 3 characters in <1 second
- ✅ Export → Import restores all settings perfectly
- ✅ Storage inspector shows live data with real-time updates

### Code Quality
- ✅ All files ≤75 lines (ESLint enforced)
- ✅ Zero TypeScript errors (`npm run typecheck`)
- ✅ Zero ESLint warnings (`npm run lint`)
- ✅ All tests pass (`npm run test`)
- ✅ **useSettings.ts deleted** - no dead code
- ✅ Code coverage maintained or improved

### User Experience
- ✅ Every setting change shows toast notification
- ✅ Invalid API keys show clear error messages
- ✅ All settings self-explanatory (no external docs needed)
- ✅ Help text expandable inline

---

## Testing Checklist

### Real-Time Sync (CRITICAL!)
- [ ] Settings page AutoRun toggle → sidepanel updates immediately
- [ ] Sidepanel AutoRun toggle → settings page updates immediately
- [ ] Settings page PreserveLog → sidepanel updates immediately
- [ ] Open 2 settings tabs → toggle in one updates the other
- [ ] Change API key in settings → value updates in storage inspector

### Code Cleanliness
- [ ] `useSettings.ts` file does NOT exist ❌
- [ ] grep for `chrome.storage.local.get.*ui:autoRun` finds ONLY useStorageSetting
- [ ] NO duplicate storage logic in codebase
- [ ] All components import from `@/shared/hooks/useStorageSetting`

### Validation
- [ ] Empty PSI key → "Using default" warning
- [ ] Invalid PSI key → Clear error message
- [ ] Valid PSI key → Success message + toast
- [ ] Test with expired/quota-exceeded key

### Search & Filter
- [ ] Type "canonical" → sees only canonical rules
- [ ] Click "og" category → sees only OG rules
- [ ] Combine search + filter → sees intersection
- [ ] Clear filters → all 101 rules visible

### Import/Export
- [ ] Export → downloads valid JSON
- [ ] Import same file → restores perfectly
- [ ] Import invalid JSON → shows error, doesn't crash
- [ ] Import from different version → handles gracefully

---

## No Breaking Changes

- ✅ All storage keys unchanged
- ✅ Existing settings values preserved
- ✅ No new dependencies
- ✅ Can deploy incrementally
- ✅ Easy rollback (revert commits)

---

## Out of Scope (KISS!)

These are explicitly NOT in this ticket:
- ❌ Multi-tab layout (single page works fine)
- ❌ Charts/visualizations (numbers are enough)
- ❌ Multiple API keys (one works)
- ❌ Per-rule config modals (can add later)
- ❌ Dark mode (not essential)
- ❌ Keyboard shortcuts (nice-to-have)
- ❌ Zustand or other state libs (Chrome APIs work!)

---

**Created:** 2025-11-15
**Updated:** 2025-11-15 (Added file deletion plan)
**Author:** Franz Enzenhofer
**Principle:** KISS + DRY - No Dead Code!
