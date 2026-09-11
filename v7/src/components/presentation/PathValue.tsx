import { useId, useState } from 'react'

import { Icon } from './Icon'

import { collapsePath } from '@/shared/presentation/pathDisplay'

const pathClass = 'font-mono [overflow-wrap:anywhere]'
const toggleClass = 'ml-1 inline-flex items-center gap-0.5 rounded px-1 align-baseline text-sm text-slate-600 underline underline-offset-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700'

/**
 * A long DOM path shows start … end; the toggle reveals the complete value and
 * collapses it again. Copy and search read the field value, never this view.
 */
export const PathValue = ({ value }: { value: string }) => {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const collapsed = collapsePath(value)
  if (!collapsed) return <span className={pathClass} data-dom-path="full">{value}</span>
  return <>
    <span id={id} className={pathClass} data-dom-path={expanded ? 'full' : 'collapsed'}>
      {expanded ? value : <>{collapsed.head}<span aria-hidden="true" className="px-0.5 text-slate-500">…</span><span className="sr-only">(middle of path hidden)</span>{collapsed.tail}</>}
    </span>
    <button type="button" className={toggleClass} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
      {expanded ? 'Collapse' : 'Expand'}<Icon name={expanded ? 'chevron-up' : 'chevron-down'} className="h-3.5 w-3.5" />
    </button>
  </>
}
