import type { Result } from '@/shared/results'

type DetailProps = { details: Result['details'] }

export const DetailsView = ({ details }: DetailProps) => {
  if (!details) return null

  // Show sourceHtml if available
  if (details.sourceHtml) {
    return (
      <div className="border-t bg-white bg-opacity-50 p-3 text-sm">
        <div className="space-y-3">
          <div>
            <span className="font-medium">Source HTML:</span>
            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
              {details.sourceHtml}
            </pre>
          </div>
          {details.domPath && (
            <div>
              <span className="font-medium">DOM Path:</span>
              <code className="ml-2 text-xs bg-gray-100 px-1 rounded">{details.domPath}</code>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Fallback: show all details as key-value pairs
  return (
    <div className="border-t bg-white bg-opacity-50 p-3 text-sm">
      <div className="space-y-2">
        {Object.entries(details).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{formatKey(key)}:</span>
            <span className="ml-2">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const formatKey = (key: string) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}