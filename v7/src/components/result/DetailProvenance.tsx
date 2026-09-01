import type { ReactElement } from 'react'

import type { Provenance } from './detailTiers'

import { displayUrl } from '@/shared/displayUrl'

/**
 * Where the verdict comes from: what was checked, and the spec it is checked
 * against. The link shows its address - the domain is the trust signal, the
 * tail is the exact section cited - never a bare "Reference" label.
 */
export const DetailProvenance = ({ provenance }: { provenance: Provenance }): ReactElement | null => {
  const { reference, tested } = provenance
  if (!reference && !tested) return null
  return (
    <p className="break-words text-xs leading-5 text-slate-500" data-testid="detail-provenance">
      {tested && <span>{tested} </span>}
      {reference && (
        <a href={reference} target="_blank" rel="noreferrer" title={reference} className="break-all text-blue-700 underline">
          {displayUrl(reference).display} ↗
        </a>
      )}
    </p>
  )
}
