import { useMemo } from 'react'

import { NoResults } from './NoResults'
import { matchesResult } from './resultQuery'
import { usePinnedRules, ruleKeyOf } from './usePinnedRules'
import { useRuleFlags } from './useRuleFlags'
import { compareResults, type ResultSortMode } from './resultSort'
import type { LogFn } from './usePanelLogger'

import { ResultCard } from '@/components/result/ResultCard'
import type { Result } from '@/shared/results'
export const Results = ({
  items,
  types,
  q,
  debugEnabled,
  onResetFilters,
  tabId,
  logUi,
  sortMode = 'name',
  defaultExpanded = false,
}: { items: Result[]; types?: string[]; q?: string; debugEnabled: boolean; onResetFilters?: () => void; tabId?: number | null; logUi?: LogFn; sortMode?: ResultSortMode; defaultExpanded?: boolean }) => {
  const { pinned, togglePin } = usePinnedRules()
  const { flags, toggleFlag } = useRuleFlags()
  const filtered = useMemo(() => items.filter((i) => matchesResult(i, types, q)), [items, types, q])
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      const keyA = ruleKeyOf(a)
      const keyB = ruleKeyOf(b)
      const pinA = keyA ? pinned[keyA] : false
      const pinB = keyB ? pinned[keyB] : false
      if (pinA !== pinB) return pinA ? -1 : 1
      return compareResults(a, b, sortMode)
    }),
    [filtered, pinned, sortMode],
  )
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
