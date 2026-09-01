import type { ReactElement } from 'react'

import { EvidenceBox } from './EvidenceBox'

import { resultPreview, resultValue } from '@/shared/resultPreview'

/**
 * The value the rule judged, under its verdict - but never text the verdict
 * message already carries. Only shown while the card is collapsed; the
 * expanded view carries the full evidence in the same box. A click copies the
 * full untruncated value even when the display is cut.
 */
export const ResultPreview = ({ details, message }: { details?: unknown; message?: string }): ReactElement | null => {
  const preview = resultPreview(details, message)
  if (!preview) return null
  return (
    <EvidenceBox testId="result-preview" title={preview} copyValue={resultValue(details)}>
      {preview}
    </EvidenceBox>
  )
}
