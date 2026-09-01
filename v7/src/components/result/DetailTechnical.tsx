import type { ReactElement } from 'react'

import { EvidenceBox } from './EvidenceBox'
import { formatLabel } from './detailText'
import type { DetailEntry } from './detailTiers'

/**
 * Selectors, raw HTTP headers, user agents: kept for debugging. Rendered flat
 * and last - expanding the card already asked for everything, so nothing here
 * hides behind a second click. Hierarchy comes from muted weight, not folding.
 */
export const DetailTechnical = ({ entries }: { entries: DetailEntry[] }): ReactElement | null => {
  if (!entries.length) return null
  return (
    <div className="space-y-2 text-xs" data-testid="detail-technical">
      {entries.map(({ key, text }) => (
        <div key={key}>
          <span className="font-medium text-slate-400">{formatLabel(key)}</span>
          <EvidenceBox tone="muted" copyValue={text}>{text}</EvidenceBox>
        </div>
      ))}
    </div>
  )
}
