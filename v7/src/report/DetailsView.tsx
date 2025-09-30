import type { EnhancedResult } from './types'

type DetailProps = { details: EnhancedResult['details'] }

export const DetailsView = ({ details }: DetailProps) => {
  if (!details) return null

  return (
    <div className="border-t bg-white bg-opacity-50 p-3 text-sm">
      <div className="space-y-3">
        {details.title && <DetailItem label="Title" value={details.title} />}
        {details.titleLength !== undefined && (
          <DetailItem label="Title Length" value={`${details.titleLength} characters`} />
        )}
        {details.description && <DetailItem label="Description" value={details.description} />}
        {details.descriptionLength !== undefined && (
          <DetailItem label="Description Length" value={`${details.descriptionLength} characters`} />
        )}
        {details.extra && <ExtraDetails data={details.extra} />}
      </div>
    </div>
  )
}

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="font-medium">{label}:</span>
    <span className="ml-2">{value}</span>
  </div>
)

type ExtraData = Record<string, unknown> & {
  issues?: string[]
  recommendations?: string[]
}

const ExtraDetails = ({ data }: { data: ExtraData }) => (
  <div className="space-y-2">
    {data.issues && (
      <div>
        <span className="font-medium text-red-600">Issues:</span>
        <ul className="list-disc pl-5 mt-1">
          {data.issues.map((issue, i) => (
            <li key={i} className="text-red-600">{issue}</li>
          ))}
        </ul>
      </div>
    )}
    {data.recommendations && (
      <div>
        <span className="font-medium text-blue-600">Recommendations:</span>
        <ul className="list-disc pl-5 mt-1">
          {data.recommendations.map((rec, i) => (
            <li key={i} className="text-blue-600">{rec}</li>
          ))}
        </ul>
      </div>
    )}
    {Object.entries(data)
      .filter(([k]) => k !== 'issues' && k !== 'recommendations')
      .map(([key, val]) => (
        <DetailItem key={key} label={formatKey(key)} value={String(val)} />
      ))}
  </div>
)

const formatKey = (key: string) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}