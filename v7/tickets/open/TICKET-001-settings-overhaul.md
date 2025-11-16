# TICKET-001: Settings Panel Overhaul

**Status:** 📋 Open
**Priority:** HIGH
**Effort:** 3-4 days
**Type:** Feature Enhancement
**Principle:** KISS - Keep It Simple, Stupid!

---

## Problem Statement

The current settings panel (`/v7/src/settings/`) has critical usability and maintenance issues:

### 🔴 CRITICAL Issues

1. **Code Duplication = Sync Nightmare**
   - `AutoRun` toggle exists in BOTH settings page AND sidepanel
   - `PreserveLog` toggle exists in BOTH settings page AND sidepanel
   - Changes in one don't reflect in the other
   - Direct `chrome.storage.local` calls scattered everywhere
   - Zero shared code = maintenance hell

2. **Zero Validation = Silent Failures**
   - PSI API key accepted without testing
   - GSC URL format not validated
   - Users don't know if settings worked
   - Rules fail silently when config is wrong

3. **101 Rules, No Search**
   - Scrolling through 101 rules in a grid is unusable
   - No way to find "canonical" or "meta-description" quickly
   - Categories exist in code but not exposed in UI

4. **No Inspection Tools**
   - Can't see what's actually stored
   - Debugging requires opening DevTools → Application → Storage
   - No way to know storage quota usage
   - Can't export/backup settings

5. **Poor User Experience**
   - No feedback when saving ("Did it work?")
   - Help text is minimal or missing
   - External links break flow
   - Auto-enable logic confusing

---

## Solution: Simple, Practical Improvements

**KISS Principle:** Fix what's broken with the simplest solution that works.
**NO:** New state management libraries, complex architectures, premature optimization.
**YES:** Use Chrome APIs, reuse existing patterns, clear code organization.

---

## Requirements (Prioritized by Impact)

### 1️⃣ **CRITICAL: Fix Code Duplication (DRY)**

**Problem:**
```
Settings Page:           Sidepanel:
GeneralSettings.tsx  →   AutoRun.tsx (duplicate!)
GeneralSettings.tsx  →   PreserveLog.tsx (duplicate!)
```

**Solution:** Create shared hooks that BOTH components use.

**Implementation:**
```typescript
// NEW FILE: /v7/src/shared/hooks/useStorageSetting.ts
import { useState, useEffect } from 'react'

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

  // Listen for changes (REAL-TIME SYNC!)
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

**Usage (replaces ALL duplicate code):**
```typescript
// Settings page: GeneralSettings.tsx
const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)
const [autoClear, setAutoClear] = useStorageSetting('ui:autoClear', true)
const [preserveLog, setPreserveLog] = useStorageSetting('ui:preserveLog', false)

// Sidepanel: AutoRun.tsx (DELETE OLD CODE, use this instead)
const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)

// Sidepanel: PreserveLog.tsx (DELETE OLD CODE, use this instead)
const [preserveLog, setPreserveLog] = useStorageSetting('ui:preserveLog', false)
```

**Files to Change:**
- ✅ CREATE: `/v7/src/shared/hooks/useStorageSetting.ts` (~40 lines)
- ✅ REFACTOR: `/v7/src/settings/GeneralSettings.tsx` (use hook)
- ✅ REFACTOR: `/v7/src/sidepanel/ui/AutoRun.tsx` (use hook)
- ✅ REFACTOR: `/v7/src/sidepanel/ui/PreserveLog.tsx` (use hook)
- ✅ DELETE: Duplicate storage code from all components

**Result:** ✨ Real-time sync across ALL contexts, zero duplication, 4 files DRY!

---

### 2️⃣ **HIGH: Add Input Validation with Feedback**

**Problem:** API keys accepted blindly, no user feedback.

**Solution:** Simple validation functions + inline error messages.

**Implementation:**
```typescript
// NEW FILE: /v7/src/shared/validation.ts (~50 lines)

export type ValidationResult = {
  valid: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}

export const validatePSIKey = async (key: string): Promise<ValidationResult> => {
  // Empty = using default (valid)
  if (!key || key.trim() === '') {
    return {
      valid: true,
      message: 'Using default API key',
      type: 'warning'
    }
  }

  // Basic format check
  if (!key.startsWith('AIza') || key.length < 30) {
    return {
      valid: false,
      message: 'Invalid format (should start with "AIza")',
      type: 'error'
    }
  }

  // Test with real API call
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
    } else {
      return { valid: false, message: `API error: ${response.status}`, type: 'error' }
    }
  } catch (err) {
    return { valid: false, message: 'Network error', type: 'error' }
  }
}

export const validateGSCUrl = (url: string): ValidationResult => {
  if (!url || url.trim() === '') {
    return {
      valid: false,
      message: 'GSC URL required for Search Console rules',
      type: 'warning'
    }
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
import { validatePSIKey, validateGSCUrl } from '@/shared/validation'

const [psiValidation, setPsiValidation] = useState<ValidationResult | null>(null)
const [gscValidation, setGscValidation] = useState<ValidationResult | null>(null)

const handlePSIBlur = async () => {
  const result = await validatePSIKey(vars['google_page_speed_insights_key'])
  setPsiValidation(result)
}

const handleGSCBlur = () => {
  const result = validateGSCUrl(vars['gsc_site_url'])
  setGscValidation(result)
}

// In render:
<input
  type="text"
  value={vars['google_page_speed_insights_key'] || ''}
  onChange={updateVar('google_page_speed_insights_key')}
  onBlur={handlePSIBlur}
  className="block w-full px-3 py-2 border rounded"
/>
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

**Files to Change:**
- ✅ CREATE: `/v7/src/shared/validation.ts` (~50 lines)
- ✅ REFACTOR: `/v7/src/settings/ApiKeys.tsx` (add validation)

**Result:** ✨ Users know immediately if their API keys work!

---

### 3️⃣ **HIGH: Add Rule Search & Filtering**

**Problem:** 101 rules in a scrolling grid = unusable.

**Solution:** Simple text filter + category checkboxes.

**Implementation:**
```typescript
// In RuleToggles.tsx
const [searchQuery, setSearchQuery] = useState('')
const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

// Get unique categories
const categories = [...new Set(rulesInventory.map(r => r.category))].sort()

// Filter rules
const filteredRules = rulesInventory.filter(rule => {
  // Text search (name, id, or description)
  const matchesSearch = !searchQuery ||
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.id.toLowerCase().includes(searchQuery.toLowerCase())

  // Category filter
  const matchesCategory = selectedCategories.size === 0 ||
    selectedCategories.has(rule.category)

  return matchesSearch && matchesCategory
})

// In render:
<div className="space-y-4">
  {/* Search */}
  <input
    type="search"
    placeholder="Search rules by name or ID..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full px-4 py-2 border rounded"
  />

  {/* Category filters */}
  <div className="flex flex-wrap gap-2">
    {categories.map(cat => {
      const count = rulesInventory.filter(r => r.category === cat).length
      const isSelected = selectedCategories.has(cat)

      return (
        <button
          key={cat}
          onClick={() => {
            const next = new Set(selectedCategories)
            if (isSelected) {
              next.delete(cat)
            } else {
              next.add(cat)
            }
            setSelectedCategories(next)
          }}
          className={cn(
            'px-3 py-1 rounded-full text-sm',
            isSelected
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {cat} ({count})
        </button>
      )
    })}
    {selectedCategories.size > 0 && (
      <button
        onClick={() => setSelectedCategories(new Set())}
        className="px-3 py-1 text-sm text-gray-600 underline"
      >
        Clear filters
      </button>
    )}
  </div>

  {/* Results count */}
  <p className="text-sm text-gray-600">
    Showing {filteredRules.length} of {rulesInventory.length} rules
  </p>

  {/* Rule grid (use filteredRules instead of rulesInventory) */}
  <div className="grid gap-2 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
    {filteredRules.map(rule => (
      // ... existing rule rendering code
    ))}
  </div>
</div>
```

**Files to Change:**
- ✅ REFACTOR: `/v7/src/settings/RuleToggles.tsx` (add search + filters)

**Result:** ✨ Find any rule in <1 second!

---

### 4️⃣ **MEDIUM: Add Storage Inspector (Debug View)**

**Problem:** Can't see what's stored without DevTools.

**Solution:** Add collapsible "Debug" section showing raw storage.

**Implementation:**
```typescript
// NEW COMPONENT: /v7/src/settings/StorageDebug.tsx (~60 lines)
import { useState, useEffect } from 'react'

export const StorageDebug = () => {
  const [storage, setStorage] = useState<Record<string, any>>({})
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const loadStorage = async () => {
      const all = await chrome.storage.local.get(null)
      setStorage(all)
    }

    loadStorage()

    // Update on changes
    const listener = () => loadStorage()
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // Calculate storage size
  const storageSize = new Blob([JSON.stringify(storage)]).size
  const storageMB = (storageSize / 1024 / 1024).toFixed(2)

  return (
    <div className="border rounded bg-gray-50 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-lg font-semibold">🔍 Storage Inspector (Debug)</h2>
        <span className="text-sm text-gray-600">
          {storageMB} MB • {Object.keys(storage).length} keys
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">
            View all data stored by this extension. Use this for debugging.
          </p>

          {/* Copy to clipboard button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(storage, null, 2))
              alert('Storage copied to clipboard!')
            }}
            className="text-sm text-blue-600 underline"
          >
            Copy all to clipboard
          </button>

          {/* Storage keys */}
          <div className="max-h-96 overflow-y-auto border rounded bg-white">
            {Object.keys(storage).sort().map(key => (
              <details key={key} className="border-b p-3">
                <summary className="cursor-pointer font-mono text-sm">
                  {key}
                  <span className="ml-2 text-gray-500">
                    ({typeof storage[key]})
                  </span>
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify(storage[key], null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Usage in SettingsApp.tsx:**
```typescript
import { StorageDebug } from './StorageDebug'

// Add at bottom of settings page
<StorageDebug />
```

**Files to Change:**
- ✅ CREATE: `/v7/src/settings/StorageDebug.tsx` (~60 lines)
- ✅ REFACTOR: `/v7/src/settings/SettingsApp.tsx` (add component)

**Result:** ✨ One click to see all stored data!

---

### 5️⃣ **MEDIUM: Add Import/Export Settings**

**Problem:** No way to backup or share settings.

**Solution:** Simple JSON download/upload buttons.

**Implementation:**
```typescript
// NEW COMPONENT: /v7/src/settings/ImportExport.tsx (~70 lines)
import { useState } from 'react'

export const ImportExport = () => {
  const [importing, setImporting] = useState(false)

  const handleExport = async () => {
    // Get all settings (not results!)
    const data = await chrome.storage.local.get([
      'rule-flags',
      'globalRuleVariables',
      'ui:autoClear',
      'ui:autoRun',
      'ui:preserveLog',
      'ui:pinnedRules'
    ])

    // Create JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)

    // Download
    const a = document.createElement('a')
    a.href = url
    a.download = `f19n-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate structure
      const validKeys = [
        'rule-flags',
        'globalRuleVariables',
        'ui:autoClear',
        'ui:autoRun',
        'ui:preserveLog',
        'ui:pinnedRules'
      ]

      const importData: Record<string, any> = {}
      for (const key of validKeys) {
        if (key in data) {
          importData[key] = data[key]
        }
      }

      // Save to storage
      await chrome.storage.local.set(importData)

      alert('Settings imported successfully!')
      window.location.reload() // Reload to show new settings
    } catch (err) {
      alert('Error importing settings: ' + (err as Error).message)
    } finally {
      setImporting(false)
      e.target.value = '' // Reset input
    }
  }

  return (
    <div className="border rounded bg-gray-50 p-4">
      <h2 className="text-lg font-semibold mb-4">💾 Backup & Restore</h2>

      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export Settings
        </button>

        <label className="px-4 py-2 border rounded cursor-pointer hover:bg-gray-100">
          {importing ? 'Importing...' : 'Import Settings'}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>

      <p className="text-sm text-gray-600 mt-3">
        Export your settings as JSON for backup or sharing. Import to restore settings.
      </p>
    </div>
  )
}
```

**Files to Change:**
- ✅ CREATE: `/v7/src/settings/ImportExport.tsx` (~70 lines)
- ✅ REFACTOR: `/v7/src/settings/SettingsApp.tsx` (add component)

**Result:** ✨ One-click backup and restore!

---

### 6️⃣ **MEDIUM: Improve Help Text & UX**

**Problem:** Help text is minimal, external links break flow.

**Solution:** Better inline help, tooltips, expandable sections.

**Implementation:**
```typescript
// NEW COMPONENT: /v7/src/shared/components/HelpText.tsx (~30 lines)
export const HelpText = ({
  children,
  expandable = false
}: {
  children: React.ReactNode
  expandable?: boolean
}) => {
  if (expandable) {
    return (
      <details className="mt-2">
        <summary className="text-xs text-blue-600 cursor-pointer">
          ℹ️ More info
        </summary>
        <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-3 rounded">
          {children}
        </div>
      </details>
    )
  }

  return (
    <p className="text-xs text-gray-600 mt-1">
      {children}
    </p>
  )
}
```

**Usage in ApiKeys.tsx:**
```typescript
<label className="block">
  <span className="text-sm font-medium text-gray-900">
    PageSpeed Insights API Key
  </span>
  <input type="text" {...props} />

  <HelpText>
    Optional. Leave empty to use default key (limited quota).
  </HelpText>

  <HelpText expandable>
    <strong>How to get your own key:</strong>
    <ol className="mt-2 ml-4 list-decimal space-y-1">
      <li>Go to <a href="https://console.cloud.google.com" className="underline">Google Cloud Console</a></li>
      <li>Create a new project or select existing</li>
      <li>Enable "PageSpeed Insights API"</li>
      <li>Go to "Credentials" → "Create Credentials" → "API Key"</li>
      <li>Copy the key and paste here</li>
    </ol>
  </HelpText>
</label>
```

**Enhanced Auto-Enable Explanation:**
```typescript
// In RuleToggles.tsx
<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
  <p className="text-sm text-blue-900">
    <strong>💡 Auto-enabled rules:</strong> Some rules automatically enable when you
    configure required API keys or sign in to Google. Look for the "auto" label.
  </p>
  <details className="mt-2">
    <summary className="text-xs text-blue-700 cursor-pointer">
      Which rules auto-enable?
    </summary>
    <ul className="mt-2 text-xs text-blue-800 space-y-1">
      <li>• PSI rules → when PSI API key is set</li>
      <li>• GSC rules → when GSC URL is set AND signed in</li>
    </ul>
  </details>
</div>
```

**Files to Change:**
- ✅ CREATE: `/v7/src/shared/components/HelpText.tsx` (~30 lines)
- ✅ REFACTOR: `/v7/src/settings/ApiKeys.tsx` (better help)
- ✅ REFACTOR: `/v7/src/settings/RuleToggles.tsx` (explain auto-enable)
- ✅ REFACTOR: `/v7/src/settings/GeneralSettings.tsx` (better descriptions)

**Result:** ✨ Settings are self-explanatory!

---

### 7️⃣ **LOW: Add Success Feedback**

**Problem:** No feedback when saving settings.

**Solution:** Simple toast notification (no library needed).

**Implementation:**
```typescript
// NEW COMPONENT: /v7/src/shared/components/Toast.tsx (~50 lines)
import { useState, useEffect } from 'react'

let toastId = 0
const toastListeners = new Set<(toast: ToastMessage) => void>()

export type ToastMessage = {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
  const toast: ToastMessage = { id: toastId++, message, type }
  toastListeners.forEach(fn => fn(toast))
}

export const Toast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 3000)
    }

    toastListeners.add(handler)
    return () => { toastListeners.delete(handler) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'px-4 py-3 rounded-lg shadow-lg text-white text-sm',
            toast.type === 'success' && 'bg-green-600',
            toast.type === 'error' && 'bg-red-600',
            toast.type === 'info' && 'bg-blue-600'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
```

**Usage:**
```typescript
// In SettingsApp.tsx
import { Toast } from '@/shared/components/Toast'

// Add to render
<Toast />

// In any setting component
import { showToast } from '@/shared/components/Toast'

const updateSetting = async () => {
  await chrome.storage.local.set({ 'ui:autoRun': true })
  showToast('Setting saved', 'success')
}
```

**Files to Change:**
- ✅ CREATE: `/v7/src/shared/components/Toast.tsx` (~50 lines)
- ✅ REFACTOR: `/v7/src/settings/SettingsApp.tsx` (add Toast)
- ✅ REFACTOR: All setting components (add showToast calls)

**Result:** ✨ Visual confirmation for every action!

---

## File Structure Summary

```
/v7/src/
├── shared/
│   ├── hooks/
│   │   └── useStorageSetting.ts          NEW (~40 lines) - DRY hook for storage
│   ├── components/
│   │   ├── HelpText.tsx                  NEW (~30 lines) - Reusable help text
│   │   └── Toast.tsx                     NEW (~50 lines) - Toast notifications
│   └── validation.ts                     NEW (~50 lines) - Input validation
│
├── settings/
│   ├── SettingsApp.tsx                   REFACTOR - Add new components
│   ├── GeneralSettings.tsx               REFACTOR - Use useStorageSetting hook
│   ├── ApiKeys.tsx                       REFACTOR - Add validation + help
│   ├── RuleToggles.tsx                   REFACTOR - Add search + category filter
│   ├── StorageDebug.tsx                  NEW (~60 lines) - Storage inspector
│   └── ImportExport.tsx                  NEW (~70 lines) - Backup/restore
│
└── sidepanel/ui/
    ├── AutoRun.tsx                       REFACTOR - Use useStorageSetting hook
    └── PreserveLog.tsx                   REFACTOR - Use useStorageSetting hook
```

**Total New Code:** ~330 lines
**Code Deleted:** ~100 lines (duplicate storage logic)
**Net Change:** ~230 lines

---

## Implementation Plan

### Day 1: Foundation (DRY)
- [ ] Create `useStorageSetting` hook
- [ ] Refactor all components to use hook
- [ ] Delete duplicate storage code
- [ ] Test real-time sync between settings and sidepanel
- [ ] Commit: `refactor(settings): eliminate duplication with shared hook`

### Day 2: Validation & Feedback
- [ ] Create validation functions
- [ ] Add validation to ApiKeys component
- [ ] Create Toast component
- [ ] Add toast notifications to all settings changes
- [ ] Commit: `feat(settings): add input validation and user feedback`

### Day 3: Usability
- [ ] Add search to RuleToggles
- [ ] Add category filters to RuleToggles
- [ ] Improve help text in all components
- [ ] Add HelpText component with expandable sections
- [ ] Commit: `feat(settings): add rule search and improved help`

### Day 4: Debug & Backup
- [ ] Create StorageDebug component
- [ ] Create ImportExport component
- [ ] Add components to SettingsApp
- [ ] Test export/import flow
- [ ] Commit: `feat(settings): add storage inspector and backup/restore`

### Day 5: Testing & Polish
- [ ] Test all components
- [ ] Test sync across contexts
- [ ] Test validation edge cases
- [ ] Test import/export with real data
- [ ] Update tests
- [ ] Fix any bugs
- [ ] Update documentation

---

## Success Criteria

### Functionality
- ✅ Settings changes sync in <100ms across all contexts
- ✅ Zero duplicate code (DRY)
- ✅ All API keys validated before use
- ✅ Users can find any rule in <5 seconds
- ✅ Export/import works without data loss
- ✅ Storage inspector shows live data

### Code Quality
- ✅ All files ≤75 lines (ESLint rule)
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ All existing tests pass
- ✅ New components have tests

### User Experience
- ✅ Every action has visual feedback
- ✅ All settings are self-explanatory
- ✅ No external documentation required for basic use
- ✅ Validation errors are clear and actionable

---

## Testing Checklist

### Real-Time Sync
- [ ] Change AutoRun in settings → verify sidepanel updates
- [ ] Change AutoRun in sidepanel → verify settings page updates
- [ ] Change PreserveLog in settings → verify sidepanel updates
- [ ] Open settings in 2 tabs → verify changes sync between them

### Validation
- [ ] Empty PSI key → shows "using default" warning
- [ ] Invalid PSI key → shows error with clear message
- [ ] Valid PSI key → shows success with checkmark
- [ ] Invalid GSC URL → shows format error
- [ ] Valid GSC URL → shows success

### Search & Filter
- [ ] Search "canonical" → shows only canonical-related rules
- [ ] Filter by "og" category → shows only OG rules
- [ ] Search + filter combined → shows intersection
- [ ] Clear filters → shows all rules again

### Import/Export
- [ ] Export → downloads JSON file
- [ ] Import exported file → restores all settings
- [ ] Import invalid JSON → shows error
- [ ] Import partial settings → only imports valid keys

### Storage Debug
- [ ] Shows all storage keys
- [ ] Expands to show values
- [ ] Updates in real-time when settings change
- [ ] Copy to clipboard works

---

## Migration Notes

### No Breaking Changes
- All existing storage keys unchanged
- All existing components keep working
- No new dependencies required (pure React + Chrome APIs)

### Progressive Enhancement
- Old code paths still work during migration
- Can deploy incrementally (feature by feature)
- Rollback is simple (revert commits)

---

## Future Enhancements (Out of Scope)

These are explicitly NOT part of this ticket (KISS!):

- ❌ Multiple API keys with load balancing (one key works fine)
- ❌ Charts and visualizations (numbers are enough)
- ❌ Multi-tab layout (current single page is fine)
- ❌ Per-rule configuration modals (can add later if needed)
- ❌ Rule scheduling (not requested by users)
- ❌ Performance budgets (premature optimization)
- ❌ Audit trail / history (can add later if needed)
- ❌ Dark mode (not essential)
- ❌ Keyboard shortcuts (nice-to-have)

---

## Questions & Decisions

### ✅ Decided
1. **State Management:** Use Chrome APIs (`chrome.storage.onChanged`) - NO Zustand
2. **UI Layout:** Keep single-page layout - NO multi-tab complexity
3. **Validation:** Simple functions + fetch - NO validation library
4. **Notifications:** Simple toast component - NO notification library

### 🤔 Open Questions
1. Should validation happen on blur or on save?
   **Recommendation:** On blur (immediate feedback)

2. Should we auto-save settings or have a "Save" button?
   **Recommendation:** Auto-save (existing pattern)

3. Should export include results or just settings?
   **Recommendation:** Settings only (results can be huge)

---

## Dependencies

**New:** NONE (uses existing dependencies)

**Existing:**
- React 18.3.1
- TypeScript 5.x
- Tailwind CSS 3.4.14
- Chrome Extension APIs

---

**Created:** 2025-11-15
**Author:** Franz Enzenhofer
**Principle:** KISS - Keep It Simple, Stupid!
