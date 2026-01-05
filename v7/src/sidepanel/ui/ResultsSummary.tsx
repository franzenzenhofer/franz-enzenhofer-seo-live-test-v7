import { useMemo, useState } from 'react'

import { matchesResult } from './resultQuery'

import { toResultCopyPayload } from '@/components/result/resultCopy'
import { getResultLabel, resultTypeOrder } from '@/shared/colors'
import type { Result } from '@/shared/results'

type Props = {
  items: Result[]
  types?: string[]
  q?: string
  typeSource?: 'search' | 'toggle'
  onResetFilters?: () => void
}

export const ResultsSummary = ({ items, types, q, typeSource, onResetFilters }: Props) => {
  const [copied, setCopied] = useState(false)
  const filtered = useMemo(() => items.filter((i) => matchesResult(i, types, q)), [items, types, q])
  const hasQuery = Boolean(q?.trim())
  const hasTypeFilters = types ? types.length !== resultTypeOrder.length : false
  const showReset = Boolean(onResetFilters) && (hasQuery || hasTypeFilters)
  const typeLabel = hasTypeFilters ? (types || []).map(getResultLabel).join(', ') || 'none' : ''
  const filterParts = [
    hasTypeFilters ? `${typeSource === 'search' ? 'Type keywords' : 'Types'}: ${typeLabel}` : '',
    hasQuery ? `Search: ${q?.trim()}` : '',
  ].filter(Boolean)
  const filterLine = filterParts.join(' • ')
  const copyContent = useMemo(() => filtered.map(toResultCopyPayload).filter(Boolean).join('\n\n'), [filtered])

  const copy = async () => {
    if (!copyContent) return
    try {
      await navigator.clipboard.writeText(copyContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">
      <div className="space-y-0.5">
        <div className="font-semibold text-slate-700">Showing {filtered.length} of {items.length}</div>
        {filterLine && <div className="text-[10px]">{filterLine}</div>}
      </div>
      <div className="flex items-center gap-1.5">
        {showReset && (
          <button className="text-[10px] text-blue-700 underline" onClick={onResetFilters} type="button">
            Reset
          </button>
        )}
        <button
          className="text-[10px] text-slate-600 underline disabled:text-slate-300"
          onClick={copy}
          disabled={!copyContent}
          type="button"
        >
          {copied ? 'Copied' : 'Copy filtered'}
        </button>
      </div>
    </div>
  )
}
