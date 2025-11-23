import { useMemo, useState } from 'react'

import { ResultDetails } from './ResultDetails'
import { ResultHeader } from './ResultHeader'
import { useResultHighlight } from './useResultHighlight'
import { toResultCopyPayload } from './resultCopy'
import { buildDomHighlight, buildDetailPayload, extractSnippet } from './resultTransforms'

import { getResultColor } from '@/shared/colors'
import type { Result } from '@/shared/results'

type Props = {
  result: Result
  index?: number
  isPinned?: boolean
  onTogglePin?: () => void
  isDisabled?: boolean
  onToggleDisable?: (ruleId: string) => void
  defaultExpanded?: boolean
  tabId?: number | null
  logUi?: (action: string, data?: Record<string, unknown>) => void
}
export const ResultCard = ({ result, index, isPinned, onTogglePin, isDisabled, onToggleDisable, defaultExpanded = false, tabId, logUi }: Props) => {
  const color = getResultColor(result.type)
  const hasDetails = Boolean(result.details)
  const [open, setOpen] = useState(hasDetails && defaultExpanded)
  const showDetails = open && hasDetails
  const snippet = extractSnippet(result.details)
  const { selectors, colors } = useMemo(() => buildDomHighlight(result), [result.details])
  const detailPayload = useMemo(() => buildDetailPayload(result.details), [result.details, snippet])
  useResultHighlight({ tabId, selectors, colors, open, ruleId: result.ruleId, logUi })
  const copyPayload = useMemo(() => toResultCopyPayload(result), [result])
  const openReport = () => {
    if (!result.runIdentifier) return
    const base = chrome.runtime.getURL('src/report.html')
    const ix = typeof index === 'number' ? index : 0
    const url = `${base}?runid=${result.runIdentifier}&index=${ix}`
    chrome.tabs.create({ url })
    logUi?.('action:open-report-rule', { ruleId: result.ruleId, runId: result.runIdentifier, index: ix })
  }
  const toggleDisable = () => {
    if (!result.ruleId) return
    onToggleDisable?.(result.ruleId)
    logUi?.('action:toggle-rule', { ruleId: result.ruleId })
  }
  return (
    <article className={`${color.full} border rounded p-3 space-y-2`} data-testid="result-card">
      <ResultHeader
        result={result}
        index={index}
        isPinned={isPinned}
        onTogglePin={onTogglePin}
        onToggleDisable={toggleDisable}
        canToggleDetails={hasDetails}
        open={hasDetails ? open : false}
        onToggleDetails={hasDetails ? () => setOpen((v) => !v) : undefined}
        dotClass={color.dot}
        copyContent={copyPayload}
        disabled={isDisabled}
        onOpenReport={result.runIdentifier ? openReport : undefined}
      />
      <p className="text-sm text-slate-900 break-words">{result.message}</p>
      {snippet && (
        <pre className="text-xs bg-white/70 border rounded p-2 whitespace-pre-wrap break-words text-slate-700">
          {snippet}
        </pre>
      )}
      {showDetails && <ResultDetails details={detailPayload} />}
    </article>
  )
}
