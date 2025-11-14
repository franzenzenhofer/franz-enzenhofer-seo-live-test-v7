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
            <button className="text-[11px] underline" onClick={copy}>Copy Result</button>
          </div>
          <ResultDetails details={result.details} />
        </div>
      )}
    </article>
  )
}
