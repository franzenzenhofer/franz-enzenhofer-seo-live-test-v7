import { useMemo } from 'react'

import { NoResults } from './NoResults'
import { usePinnedRules, ruleKeyOf } from './usePinnedRules'

import { ResultCard } from '@/components/result/ResultCard'
import { resultSortOrder } from '@/shared/colors'
import type { Result } from '@/shared/results'

// Detect if result is "unconfigured" (missing API key, not logged in, etc.)
const isUnconfigured = (r: Result): boolean => {
  const msg = r.message.toLowerCase()
  return (
    msg.includes('no psi key') ||
    msg.includes('not logged in') ||
    msg.includes('no key set') ||
    msg.includes('no token') ||
    msg.includes('no api key') ||
    msg.includes('authentication required') ||
    msg.includes('auth required')
  )
}

export const Results = ({ items, types, q }: { items: Result[]; types?: string[]; q?: string }) => {
  const { pinned, togglePin } = usePinnedRules()
  const filtered = useMemo(() => items.filter((i) => {
    // Handle "unconfigured" type filter
    if (types && types.includes('unconfigured')) {
      if (!isUnconfigured(i)) return false
    } else if (types) {
      // Regular type filter (exclude unconfigured check)
      if (!types.includes(i.type)) return false
    }

    if (q && !`${i.label} ${i.message}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [items, types, q])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const keyA = ruleKeyOf(a)
      const keyB = ruleKeyOf(b)
      const pinA = keyA ? pinned[keyA] : false
      const pinB = keyB ? pinned[keyB] : false
      if (pinA !== pinB) return pinA ? -1 : 1
      const orderA = resultSortOrder[a.type as keyof typeof resultSortOrder] ?? 999
      const orderB = resultSortOrder[b.type as keyof typeof resultSortOrder] ?? 999
      if (orderA !== orderB) return orderA - orderB
      return (keyA || a.label).localeCompare(keyB || b.label)
    })
  }, [filtered, pinned])

  return (
    <div className="space-y-2">
      {sorted.map((r, i) => {
        const key = ruleKeyOf(r)
        return (
          <ResultCard
            key={`${key || r.label}-${i}`}
            result={r}
            index={items.indexOf(r)}
            isPinned={Boolean(key && pinned[key])}
            onTogglePin={key ? () => togglePin(key) : undefined}
            collapsible
          />
        )
      })}
      {!filtered.length && <NoResults items={items} types={types} q={q} />}
    </div>
  )
}
