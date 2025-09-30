import { useState } from 'react'

import { ResultCard } from './ResultCard'
import type { EnhancedResult } from './types'

import { getResultColor } from '@/shared/colors'

export const EnhancedReportSection = ({
  type,
  items
}: {
  type: string;
  items: (EnhancedResult & { index: number })[]
}) => {
  const color = getResultColor(type)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const toggleExpand = (index: number) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
        <span className={`w-3 h-3 rounded-full ${color.dot}`}></span>
        {type.toUpperCase()} ({items.length})
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <ResultCard
            key={item.index}
            item={item}
            color={color}
            expanded={expanded[item.index] || false}
            onToggle={() => toggleExpand(item.index)}
          />
        ))}
      </div>
    </div>
  )
}