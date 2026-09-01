import type { ReactElement } from 'react'

import type { GuidanceEntry } from './detailTiers'

const isFix = (label: string): boolean => label === 'Fix'

/**
 * Diagnosis and remedy - the most actionable content on the card. A short
 * readable statement, with the fix carrying the emphasis, never a grid row.
 */
export const DetailGuidance = ({ entries }: { entries: GuidanceEntry[] }): ReactElement | null => {
  if (!entries.length) return null
  return (
    <div className="space-y-0.5 text-xs" data-testid="detail-guidance">
      {entries.map(({ key, text, label }) => (
        <p key={key} className="break-words leading-5">
          <span className={`font-semibold ${isFix(label) ? 'text-emerald-800' : 'text-amber-800'}`}>{label}:</span>{' '}
          <span className={isFix(label) ? 'font-medium text-slate-900' : 'text-slate-700'}>{text}</span>
        </p>
      ))}
    </div>
  )
}
