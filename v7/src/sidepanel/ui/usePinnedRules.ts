import { useEffect, useState } from 'react'

import type { Result } from '@/shared/results'

const PIN_KEY = 'ui:pinnedRules'
const LEGACY_KEY = 'favorites'

export const ruleKeyOf = (result: Result) => result.ruleId || result.name || result.label

export const usePinnedRules = () => {
  const [pinned, setPinned] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      const { [PIN_KEY]: stored, [LEGACY_KEY]: legacy } = await chrome.storage.local.get([PIN_KEY, LEGACY_KEY])
      if (stored) {
        setPinned((stored as Record<string, boolean>) || {})
        return
      }
      if (legacy) {
        const legacyPinned = legacy as Record<string, boolean>
        setPinned(legacyPinned)
        chrome.storage.local.set({ [PIN_KEY]: legacyPinned }).catch(() => {})
        return
      }
      setPinned({})
    }
    load().catch(() => {})
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[PIN_KEY]) {
        setPinned((changes[PIN_KEY].newValue as Record<string, boolean>) || {})
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const togglePin = (key: string | undefined | null) => {
    if (!key) return
    setPinned((prev) => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = true
      chrome.storage.local.set({ [PIN_KEY]: next }).catch(() => {})
      return next
    })
  }

  return { pinned, togglePin }
}
