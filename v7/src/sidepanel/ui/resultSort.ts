import { resultSortOrder } from '@/shared/colors'
import type { Result } from '@/shared/results'

export type ResultSortMode = 'name' | 'priority'

const priorityValue = (result: Result) =>
  typeof result.priority === 'number' ? result.priority : Number.POSITIVE_INFINITY

export const compareResults = (a: Result, b: Result, mode: ResultSortMode) => {
  const orderA = resultSortOrder[a.type as keyof typeof resultSortOrder] ?? 999
  const orderB = resultSortOrder[b.type as keyof typeof resultSortOrder] ?? 999

  if (mode === 'priority') {
    const prA = priorityValue(a)
    const prB = priorityValue(b)
    if (prA !== prB) return prA - prB
  }

  if (orderA !== orderB) return orderA - orderB

  const nameA = (a.ruleId || a.name || a.label || '').toLowerCase()
  const nameB = (b.ruleId || b.name || b.label || '').toLowerCase()
  return nameA.localeCompare(nameB)
}
