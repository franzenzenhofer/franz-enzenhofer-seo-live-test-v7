// Unified color system for result types
import { resultColors } from './colorDefs'

export { resultColors } from './colorDefs'

export type ResultType = keyof typeof resultColors

export const resultTypeOrder = ['error', 'warn', 'info', 'ok', 'runtime_error', 'pending', 'disabled'] as const

export const resultTypeLabels: Record<ResultType, string> = {
  error: 'failed',
  runtime_error: 'rule error',
  warn: 'warn',
  info: 'info',
  ok: 'ok',
  pending: 'pending',
  disabled: 'disabled',
}

export const getResultLabel = (type: string) => resultTypeLabels[type as ResultType] || type

export const getResultColor = (type: string) =>
  resultColors[type as ResultType] || {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-900',
    dot: 'bg-gray-500',
    badge: 'bg-gray-100 text-gray-800',
    full: 'bg-gray-50 border-gray-300 text-gray-900',
  }

export const resultSortOrder = resultTypeOrder.reduce<Record<ResultType, number>>((acc, type, index) => {
  acc[type] = index
  return acc
}, {} as Record<ResultType, number>)

export const sortResultsByPriority = <T extends { type: string }>(results: T[]) =>
  [...results].sort((a, b) => {
    const orderA = resultSortOrder[a.type as ResultType] ?? 999
    const orderB = resultSortOrder[b.type as ResultType] ?? 999
    return orderA - orderB
  })
