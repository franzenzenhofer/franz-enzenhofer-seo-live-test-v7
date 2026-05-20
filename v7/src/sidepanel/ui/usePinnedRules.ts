import { useEffect, useState } from 'react'

import { useStorageListener } from '@/shared/hooks/useStorageListener'
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
  }, [])

  useStorageListener(PINNED_RULE_STORAGE_KEY, (newValue, _old, area) => {
    if (area === 'local') setPinned((newValue as Record<string, boolean>) || {})
  })

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
