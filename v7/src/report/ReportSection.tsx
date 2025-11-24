import { ResultCard } from '@/components/result/ResultCard'
import { getResultLabel } from '@/shared/colors'
import type { Result } from '@/shared/results'

export const ReportSection = ({
  type,
  items
}: {
  type: string;
  items: (Result & { index: number })[]
}) => (
  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
    <h2 className="text-lg font-semibold">
      {getResultLabel(type).toUpperCase()} ({items.length})
    </h2>
    <div className="space-y-2">
      {items.map((item) => (
        <ResultCard key={item.index} result={item} displayIndex={item.index} defaultExpanded />
      ))}
    </div>
  </div>
)
