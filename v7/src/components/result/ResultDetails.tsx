import type { ReactElement } from 'react'

import { DetailRecords } from './DetailRecords'
import { DetailGuidance } from './DetailGuidance'
import { DetailMeasurements } from './DetailMeasurements'
import { DetailProvenance } from './DetailProvenance'
import { DetailTechnical } from './DetailTechnical'
import { EvidenceBox } from './EvidenceBox'
import { ResourceIssues } from './ResourceIssues'
import { NavigationJourney } from './NavigationJourney'
import { formatLabel } from './detailText'
import { hasTierContent, tierDetails } from './detailTiers'

import type { Result } from '@/shared/results'
import { readResourceIssues } from '@/shared/resourceIssues'
import { readNavigationSteps } from '@/shared/navigationSteps'
import { isDetailRecord } from '@/shared/readableDetails'

type Props = { details?: Result['details']; snippet?: string | null }

/**
 * The expanded card, tiered by what the reader needs: the judged value once,
 * diagnosis and fix next, compact facts, raw markup only when it adds
 * something, technical payloads muted and last, and the spec reference as a
 * footer. Expanded means everything: nothing folded, nothing truncated.
 */
export const ResultDetails = ({ details, snippet }: Props): ReactElement | null => {
  const issues = readResourceIssues(details?.['resourceIssues'])
  const steps = readNavigationSteps(details?.['navigationSteps'])
  const hidden = [...(issues.length ? ['resourceIssues', 'count', 'insecureFormActionCount'] : []), ...(steps.length ? ['navigationSteps', 'issue', 'tempRedirectCodes'] : [])]
  const entries = Object.entries(details ?? {}).filter(([key]) => !hidden.includes(key))
  const records = entries.filter(([key, value]) => !['apiResponse', 'httpHeaders', 'headers', 'navigationTiming'].includes(key)
    && (isDetailRecord(value) || (Array.isArray(value) && value.some(isDetailRecord))))
  const genericDetails = Object.fromEntries(entries.filter(([key]) => !records.some(([recordKey]) => recordKey === key)))
  const tiers = tierDetails(genericDetails, snippet)
  if (!hasTierContent(tiers) && !issues.length && !steps.length && !records.length) return null
  return (
    <div className={`mt-2 space-y-2 border-t pt-2 text-xs ${issues.length || steps.length ? '[&_p]:text-base [&_dl]:text-base' : ''}`}>
      {tiers.evidence.map(({ key, text }) => (
        <div key={key || 'snippet'}>
          {key && <span className="font-medium text-slate-500">{formatLabel(key)}</span>}
          <EvidenceBox testId="detail-evidence" copyValue={text}>{text}</EvidenceBox>
        </div>
      ))}
      {issues.length > 0 && <ResourceIssues issues={issues} />}
      {steps.length > 0 && <NavigationJourney steps={steps} />}
      <DetailGuidance entries={tiers.guidance} />
      <DetailRecords entries={records.map(([key, value]) => ({ key, value }))} />
      <DetailMeasurements entries={tiers.measurements} />
      {tiers.source.map(({ key, text }) => (
        <div key={key} data-testid="detail-source">
          <span className="font-medium text-slate-400">{formatLabel(key)}</span>
          <EvidenceBox tone="muted" copyValue={text}>{text}</EvidenceBox>
        </div>
      ))}
      <DetailTechnical entries={tiers.technical} />
      <DetailProvenance provenance={tiers.provenance} />
    </div>
  )
}
