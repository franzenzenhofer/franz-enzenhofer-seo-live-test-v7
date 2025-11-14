import { useEffect, useState } from 'react'

import type { Result } from '@/shared/results'

const PIN_KEY = 'ui:pinnedRules'

export const ruleKeyOf = (result: Result) => result.ruleId || result.name || result.label

export const usePinnedRules = () => {
  const [pinned, setPinned] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      const { [PIN_KEY]: stored } = await chrome.storage.local.get(PIN_KEY)
      setPinned((stored as Record<string, boolean>) || {})
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
