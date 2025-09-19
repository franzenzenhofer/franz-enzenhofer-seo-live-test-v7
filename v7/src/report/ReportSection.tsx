import type { Result } from '@/shared/results'

export const ReportSection = ({
  type,
  items
}: {
  type: string;
  items: (Result & { index: number })[]
}) => (
  <div className="report-section">
    <h2 className="flex items-center gap-2">
      <span className={`dt-status ${type}`}></span>
      {type.toUpperCase()} ({items.length})
    </h2>
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.index}
          id={`result-${item.index}`}
          className={`result-item ${type}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <strong className="text-sm">{item.label}</strong>
              <p className="mt-1">{item.message}</p>
            </div>
            <span className="text-xs text-gray-500">#{item.index + 1}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)