import type { Result } from '@/shared/results'
import { resultSortOrder } from '@/shared/colors'

export const groupResults = (results: Result[]) => {
  const grouped = results.reduce(
    (acc, result, index) => {
      const type = result.type || 'info'
      if (!acc[type]) acc[type] = []
      acc[type].push({ ...result, index })
      return acc
    },
    {} as Record<string, (Result & { index: number })[]>,
  )
  return Object.entries(grouped).sort(([a], [b]) => {
    const orderA = resultSortOrder[a as keyof typeof resultSortOrder] ?? 999
    const orderB = resultSortOrder[b as keyof typeof resultSortOrder] ?? 999
    return orderA - orderB
  })
}
