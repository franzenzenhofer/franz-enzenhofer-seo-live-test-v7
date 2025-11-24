import { useMemo } from 'react'

import { NoResults } from './NoResults'
import { usePinnedRules, ruleKeyOf } from './usePinnedRules'
import { useRuleFlags } from './useRuleFlags'
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
  defaultExpanded = false,
}: {
  items: Result[]
  types?: string[]
  q?: string
  debugEnabled: boolean
  onResetFilters?: () => void
  tabId?: number | null
  logUi?: LogFn
  defaultExpanded?: boolean
}) => {
  const { pinned, togglePin } = usePinnedRules()
  const { flags, toggleFlag } = useRuleFlags()
  const filtered = useMemo(() => items.filter((i) => {
    if (types?.includes('unconfigured')) return isResultUnconfigured(i)
    if (types && !types.includes(i.type)) return false
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
        const disabled = r.ruleId ? flags[r.ruleId] === false : false
        const originalIndex = items.indexOf(r)
        const displayIndex = typeof r.runIndex === 'number' ? r.runIndex : originalIndex + 1
        return (
          <ResultCard
            key={`${key || r.label}-${i}`}
            result={r}
            index={typeof r.runIndex === 'number' ? undefined : originalIndex}
            displayIndex={displayIndex}
            isPinned={Boolean(key && pinned[key])}
            onTogglePin={key ? () => togglePin(key) : undefined}
            isDisabled={disabled}
            onToggleDisable={r.ruleId ? () => toggleFlag(r.ruleId!) : undefined}
            defaultExpanded={defaultExpanded}
            tabId={tabId}
            logUi={logUi}
          />
        )
      })}
      {!filtered.length && <NoResults items={items} types={types} q={q} debugEnabled={debugEnabled} onResetFilters={onResetFilters} />}
    </div>
  )
}
