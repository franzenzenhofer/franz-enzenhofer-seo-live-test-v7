import type { Result } from '@/shared/results'
import { getResultColor } from '@/shared/colors'

export const ReportSection = ({
  type,
  items
}: {
  type: string;
  items: (Result & { index: number })[]
}) => {
  const color = getResultColor(type)

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
        <span className={`w-3 h-3 rounded-full ${color.dot}`}></span>
        {type.toUpperCase()} ({items.length})
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.index}
            id={`result-${item.index}`}
            className={`p-3 border rounded-md ${color.full}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <strong className="text-sm font-medium">{item.label}</strong>
                <p className="mt-1 text-sm">{item.message}</p>
              </div>
              <span className="text-xs opacity-60">#{item.index + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}