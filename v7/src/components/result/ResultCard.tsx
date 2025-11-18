import { useMemo, useState } from 'react'

import { ResultDetails } from './ResultDetails'
import { ResultHeader } from './ResultHeader'
import { useResultHighlight } from './useResultHighlight'
import { toResultCopyPayload } from './resultCopy'
import { ResultDomPath } from './ResultDomPath'

import { getResultColor } from '@/shared/colors'
import type { Result } from '@/shared/results'

type Props = {
  result: Result
  index?: number
  isPinned?: boolean
  onTogglePin?: () => void
  defaultExpanded?: boolean
  tabId?: number | null
  logUi?: (action: string, data?: Record<string, unknown>) => void
}
export const ResultCard = ({ result, index, isPinned, onTogglePin, defaultExpanded = false, tabId, logUi }: Props) => {
  const color = getResultColor(result.type)
  const hasDetails = Boolean(result.details)
  const [open, setOpen] = useState(hasDetails && defaultExpanded)
  const showDetails = open && hasDetails
  const snippet = typeof result.details?.snippet === 'string' ? result.details?.snippet : null
  const selectors = useMemo(() => {
    if (!result.details) return []
    const list = result.details['domPaths']
    if (Array.isArray(list)) return list.filter(Boolean) as string[]
    const single = result.details['domPath']
    if (typeof single === 'string') return [single]
    return []
  }, [result.details])
  const detailPayload = useMemo(() => {
    if (!result.details) return undefined
    const clean = { ...result.details }
    delete (clean as Record<string, unknown>)['snippet']
    delete (clean as Record<string, unknown>)['domPath']
    delete (clean as Record<string, unknown>)['domPaths']
    return clean
  }, [result.details, snippet])
  useResultHighlight({ tabId, selectors, open, ruleId: result.ruleId, logUi })
  const copyPayload = useMemo(() => toResultCopyPayload(result), [result])
  const domPathPreview = selectors[0]
  const additionalTargets = selectors.length > 1 ? selectors.length - 1 : 0
  return (
    <article className={`${color.full} border rounded p-3 space-y-2`} data-testid="result-card">
      <ResultHeader
        result={result}
        index={index}
        isPinned={isPinned}
        onTogglePin={onTogglePin}
        canToggleDetails={hasDetails}
        open={hasDetails ? open : false}
        onToggleDetails={hasDetails ? () => setOpen((v) => !v) : undefined}
        dotClass={color.dot}
        copyContent={copyPayload}
      />
      <p className="text-sm text-slate-900 break-words">{result.message}</p>
      {snippet && (
        <pre className="text-xs bg-white/70 border rounded p-2 whitespace-pre-wrap break-words text-slate-700">
          {snippet}
        </pre>
      )}
      {domPathPreview && <ResultDomPath selector={domPathPreview} extraCount={additionalTargets} />}
      {showDetails && (
        <ResultDetails details={detailPayload} />
      )}
    </article>
  )
}
