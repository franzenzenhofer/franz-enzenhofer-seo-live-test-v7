import { DetailsView } from './DetailsView'
import { formatRuleName } from './formatRuleName'
import type { EnhancedResult } from './types'

import type { ColorSet } from '@/shared/colorDefs'

export const ResultCard = ({
  item,
  color,
}: {
  item: EnhancedResult & { index: number }
  color: ColorSet
}) => {
  const hasDetails = item.details && Object.keys(item.details).length > 0
  const ruleName = formatRuleName(item)

  return (
    <div
      id={`result-${item.index}`}
      className={`border rounded-md ${color.full}`}
    >
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-sm font-medium">{item.label}</strong>
              {ruleName && (
                <span className="text-xs opacity-60">{ruleName}</span>
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
      {hasDetails && (
        <DetailsView details={item.details} />
      )}
    </div>
  )
}
