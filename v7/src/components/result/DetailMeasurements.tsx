import type { ReactElement } from 'react'

import { formatLabel } from './detailText'
import { useCopyFeedback } from './useCopyFeedback'
import type { DetailEntry } from './detailTiers'

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value)

const CopyValue = ({ text }: { text: string }): ReactElement => {
  const { copied, copy } = useCopyFeedback()
  return (
    <button
      type="button"
      title="Click to copy"
      aria-label="Copy this value"
      onClick={() => void copy(text)}
      className="relative cursor-copy break-words text-left font-medium text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
    >
      {text}
      {copied && <span className="ml-1 rounded bg-slate-800/90 px-1 text-white" data-testid="copied-toast">Copied</span>}
    </button>
  )
}

/**
 * Facts: counts, lengths, flags, single URLs - one compact row each, never a
 * full-width block. Label muted with a colon; value stronger and copyable;
 * long values wrap under the label instead of squeezing into a column.
 */
export const DetailMeasurements = ({ entries }: { entries: DetailEntry[] }): ReactElement | null => {
  if (!entries.length) return null
  return (
    <dl className="space-y-0.5 text-xs" data-testid="detail-measurements">
      {entries.map(({ key, text }) => (
        <div key={key} className="flex flex-wrap items-baseline gap-x-2 leading-5">
          <dt className="text-slate-500">{formatLabel(key)}:</dt>
          <dd className="min-w-0 break-words">
            {isHttpUrl(text) ? (
              <a href={text} target="_blank" rel="noreferrer" title={text} className="break-all font-medium text-blue-700 underline">{text}</a>
            ) : (
              <CopyValue text={text} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
