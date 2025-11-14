import { useState } from 'react'

import { ResultDetails } from './ResultDetails'
import { ResultHeader } from './ResultHeader'

import { getResultColor } from '@/shared/colors'
import type { Result } from '@/shared/results'

type Props = {
  result: Result
  index?: number
  isPinned?: boolean
  onTogglePin?: () => void
  collapsible?: boolean
  defaultExpanded?: boolean
}

export const ResultCard = ({ result, index, isPinned, onTogglePin, collapsible, defaultExpanded }: Props) => {
  const color = getResultColor(result.type)
  const [open, setOpen] = useState(!collapsible || Boolean(defaultExpanded))
  const showDetails = open && Boolean(result.details)
  const copy = async () => { try { await navigator.clipboard.writeText(JSON.stringify(result, null, 2)) } catch { /* ignore */ } }

  return (
    <article className={`${color.full} border rounded p-3 space-y-2`}>
      <ResultHeader
        result={result}
        index={index}
        isPinned={isPinned}
        onTogglePin={onTogglePin}
        canToggleDetails={Boolean(result.details && collapsible)}
        open={open}
        onToggleDetails={() => setOpen((v) => !v)}
        dotClass={color.dot}
      />
      <p className="text-sm text-slate-900 break-words">{result.message}</p>
      {showDetails && (
        <div>
          <div className="flex justify-end">
            <button
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              onClick={copy}
              title="Copy result JSON"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
          <ResultDetails details={result.details} />
        </div>
      )}
    </article>
  )
}
