import { useMemo } from 'react'

import { NoResults } from './NoResults'
import { usePinnedRules, ruleKeyOf } from './usePinnedRules'
import type { LogFn } from './usePanelLogger'

import { ResultCard } from '@/components/result/ResultCard'
import { resultSortOrder } from '@/shared/colors'
import { isResultUnconfigured, type Result } from '@/shared/results'

export const Results = ({
  items,
  types,
  q,
  debugEnabled,
  onResetFilters,
  tabId,
  logUi,
}: {
  items: Result[]
  types?: string[]
  q?: string
  debugEnabled: boolean
  onResetFilters?: () => void
  tabId?: number | null
  logUi?: LogFn
}) => {
  const { pinned, togglePin } = usePinnedRules()
  const filtered = useMemo(() => items.filter((i) => {
    // Handle "unconfigured" type filter
    if (types && types.includes('unconfigured')) {
      if (!isResultUnconfigured(i)) return false
    } else if (types) {
      // Regular type filter (exclude unconfigured check)
      if (!types.includes(i.type)) return false
    }

    if (q && !`${i.label} ${i.message}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [items, types, q])
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const keyA = ruleKeyOf(a)
    const keyB = ruleKeyOf(b)
    const pinA = keyA ? pinned[keyA] : false
    const pinB = keyB ? pinned[keyB] : false
    if (pinA !== pinB) return pinA ? -1 : 1
    const orderA = resultSortOrder[a.type as keyof typeof resultSortOrder] ?? 999
    const orderB = resultSortOrder[b.type as keyof typeof resultSortOrder] ?? 999
    if (orderA !== orderB) return orderA - orderB
    return (keyA || a.label).localeCompare(keyB || b.label)
  }), [filtered, pinned])

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
            defaultExpanded={Boolean(r.priority && r.priority >= 1000)}
            tabId={tabId}
            logUi={logUi}
          />
        )
      })}
      {!filtered.length && <NoResults items={items} types={types} q={q} debugEnabled={debugEnabled} onResetFilters={onResetFilters} />}
    </div>
  )
}
