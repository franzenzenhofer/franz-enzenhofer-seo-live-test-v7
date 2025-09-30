import { DetailsView } from './DetailsView'
import type { EnhancedResult } from './types'

import type { ColorSet } from '@/shared/colorDefs'

export const ResultCard = ({
  item,
  color,
  expanded,
  onToggle
}: {
  item: EnhancedResult & { index: number }
  color: ColorSet
  expanded: boolean
  onToggle: () => void
}) => {
  const hasDetails = item.details && Object.keys(item.details).length > 0

  return (
    <div
      id={`result-${item.index}`}
      className={`border rounded-md ${color.full} transition-all`}
    >
      <div
        className={`p-3 ${hasDetails ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
        onClick={hasDetails ? onToggle : undefined}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-medium">{item.label}</strong>
              {item.name && (
                <span className="text-xs opacity-60">{item.name}</span>
              )}
              {hasDetails && (
                <button className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                  {expanded ? '▼ Hide' : '▶ Show'} Details
                </button>
              )}
            </div>
            <p className="mt-1 text-sm">{item.message}</p>
            {item.timestamp && (
              <p className="text-xs opacity-60 mt-1">
                {new Date(item.timestamp).toLocaleString()}
              </p>
            )}
          </div>
          <span className="text-xs opacity-60">#{item.index + 1}</span>
        </div>
      </div>
      {expanded && hasDetails && (
        <DetailsView details={item.details} />
      )}
    </div>
  )
}