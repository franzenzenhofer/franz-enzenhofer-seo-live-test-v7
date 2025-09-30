// Unified color system for result types
import { resultColors } from './colorDefs'

export { resultColors } from './colorDefs'

export type ResultType = keyof typeof resultColors

export const getResultColor = (type: string) => {
  return resultColors[type as ResultType] || {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-900',
    dot: 'bg-gray-500',
    badge: 'bg-gray-100 text-gray-800',
    full: 'bg-gray-50 border-gray-300 text-gray-900'
  }
}

// Sort order for results (errors first)
export const resultSortOrder = {
  error: 0,
  warn: 1,
  info: 2,
  ok: 3
} as const

export const sortResultsByPriority = <T extends { type: string }>(results: T[]): T[] => {
  return [...results].sort((a, b) => {
    const orderA = resultSortOrder[a.type as ResultType] ?? 999
    const orderB = resultSortOrder[b.type as ResultType] ?? 999
    return orderA - orderB
  })
}