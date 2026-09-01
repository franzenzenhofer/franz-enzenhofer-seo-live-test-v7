import type { ReactElement } from 'react'

import { EvidenceBox } from './EvidenceBox'

import { resultPreview, resultValue } from '@/shared/resultPreview'

/**
 * The value the rule judged, under its verdict - the canonical, copyable
 * representation of the thing, always rendered when a value exists. Only
 * shown while the card is collapsed; the expanded view carries the full
 * evidence in the same box. A click copies the full untruncated value.
 */
export const ResultPreview = ({ details }: { details?: unknown }): ReactElement | null => {
  const preview = resultPreview(details)
  if (!preview) return null
  return (
    <EvidenceBox testId="result-preview" title={preview} copyValue={resultValue(details)}>
      {preview}
    </EvidenceBox>
  )
}
