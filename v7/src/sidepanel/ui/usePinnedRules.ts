import { useEffect, useState } from 'react'

import { PINNED_RULE_STORAGE_KEY } from '@/shared/favorites'
import type { Result } from '@/shared/results'

export const ruleKeyOf = (result: Result) => result.ruleId || result.name || result.label

export const usePinnedRules = () => {
  const [pinned, setPinned] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      const { [PINNED_RULE_STORAGE_KEY]: stored } = await chrome.storage.local.get(PINNED_RULE_STORAGE_KEY)
      setPinned((stored as Record<string, boolean>) || {})
    }
    load().catch(() => {})
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[PINNED_RULE_STORAGE_KEY]) {
        setPinned((changes[PINNED_RULE_STORAGE_KEY].newValue as Record<string, boolean>) || {})
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
      chrome.storage.local.set({ [PINNED_RULE_STORAGE_KEY]: next }).catch(() => {})
      return next
    })
  }

  return { pinned, togglePin }
}
