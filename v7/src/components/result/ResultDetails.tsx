import type { ReactElement } from 'react'

import { DetailGuidance } from './DetailGuidance'
import { DetailMeasurements } from './DetailMeasurements'
import { DetailProvenance } from './DetailProvenance'
import { DetailTechnical } from './DetailTechnical'
import { EvidenceBox } from './EvidenceBox'
import { formatLabel } from './detailText'
import { hasTierContent, tierDetails } from './detailTiers'

import type { Result } from '@/shared/results'

type Props = { details?: Result['details']; snippet?: string | null; message?: string }

/**
 * The expanded card, tiered by what the reader needs: the judged value once,
 * diagnosis and fix next, compact facts, raw markup only when it adds
 * something, technical payloads muted and last, and the spec reference as a
 * footer. Expanded means everything: nothing folded, nothing truncated.
 */
export const ResultDetails = ({ details, snippet, message }: Props): ReactElement | null => {
  const tiers = tierDetails(details, snippet, message)
  if (!hasTierContent(tiers)) return null
  return (
    <div className="mt-2 space-y-2 border-t pt-2 text-xs">
      {tiers.evidence.map(({ key, text }) => (
        <div key={key || 'snippet'}>
          {key && <span className="font-medium text-slate-500">{formatLabel(key)}</span>}
          <EvidenceBox testId="detail-evidence" copyValue={text}>{text}</EvidenceBox>
        </div>
      ))}
      <DetailGuidance entries={tiers.guidance} />
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
