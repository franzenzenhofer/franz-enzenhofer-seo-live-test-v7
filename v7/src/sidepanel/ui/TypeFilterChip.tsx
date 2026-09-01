import type { MouseEvent } from 'react'

import { getResultColor, getResultLabel } from '@/shared/colors'

type Props = {
  type: string
  count: number
  selected: boolean
  filtering: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

/**
 * Unfiltered, every chip reads as available. Once a filter is on, selected
 * chips carry their colour and a ring; the rest recede so the active filter is
 * obvious at a glance. A chip with no results is not a filter you can apply.
 */
export const TypeFilterChip = ({ type, count, selected, filtering, onClick }: Props) => {
  const colors = getResultColor(type)
  const empty = count === 0
  const active = !filtering || selected
  const tone = empty
    ? 'bg-white text-slate-300 border-slate-200'
    : active
      ? `${colors.badge} ${colors.border}`
      : 'bg-white text-slate-400 border-slate-200'
  const ring = filtering && selected ? 'ring-2 ring-offset-1 ring-violet-400' : ''
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={empty}
      aria-pressed={filtering ? selected : false}
      title={empty
        ? `No ${getResultLabel(type)} results`
        : filtering && selected
          ? `Stop showing ${getResultLabel(type)}`
          : `Show only ${getResultLabel(type)} (alt-click from anywhere)`}
      className={`flex items-center gap-1 rounded border-2 px-2 py-0.5 text-xs font-medium transition-all disabled:cursor-not-allowed ${tone} ${ring}`}
    >
      <span>{getResultLabel(type)}</span>
      <span className="font-semibold tabular-nums">{count}</span>
    </button>
  )
}
