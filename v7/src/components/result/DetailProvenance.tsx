import type { ReactElement } from 'react'

import type { Provenance } from './detailTiers'

import { displayUrl } from '@/shared/displayUrl'

// Who stands behind the check - the badge names the authority class.
const PROVENANCE_BADGES: Record<string, string> = {
  google: 'Google documentation',
  standard: 'Web standard',
  franz: 'Franz Enzenhofer best practice',
  general: 'Industry best practice',
}

/**
 * Where the verdict comes from: what was checked, and the spec it is checked
 * against. The link shows its address - the domain is the trust signal, the
 * tail is the exact section cited - never a bare "Reference" label.
 */
export const DetailProvenance = ({ provenance }: { provenance: Provenance }): ReactElement | null => {
  const { reference, tested } = provenance
  const badge = provenance.provenance ? PROVENANCE_BADGES[provenance.provenance] : undefined
  if (!reference && !tested && !badge) return null
  return (
    <p className="break-words text-xs leading-5 text-slate-500" data-testid="detail-provenance">
      {badge && (
        <span className="mr-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600" data-testid="provenance-badge">
          {badge}
        </span>
      )}
      {tested && <span>{tested} </span>}
      {reference && (
        <a href={reference} target="_blank" rel="noreferrer" title={reference} className="break-all text-blue-700 underline">
          {displayUrl(reference).display} ↗
        </a>
      )}
    </p>
  )
}
