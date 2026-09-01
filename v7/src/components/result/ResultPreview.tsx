import { EvidenceBox } from './EvidenceBox'

import { resultPreview } from '@/shared/resultPreview'

/**
 * The value the rule judged, under its verdict. "Title set." is not useful on
 * its own - the point is which title. Only shown while the card is collapsed,
 * since the expanded view carries the full evidence in the same box.
 */
export const ResultPreview = ({ details }: { details?: unknown }) => {
  const preview = resultPreview(details)
  if (!preview) return null
  return <EvidenceBox testId="result-preview" title={preview}>{preview}</EvidenceBox>
}
