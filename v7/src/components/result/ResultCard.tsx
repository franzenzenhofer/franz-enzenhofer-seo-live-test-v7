import { useMemo, useState } from 'react'

import { MessageWithLinks } from './MessageWithLinks'
import { ResultDetails } from './ResultDetails'
import { ResultHeader } from './ResultHeader'
import { ResultMetadata } from './ResultMetadata'
import { useResultHighlight } from './useResultHighlight'
import { toResultCopyPayload } from './resultCopy'
import { buildDomHighlight, buildDetailPayload, extractSnippet } from './resultTransforms'
import { ResultPreview } from './ResultPreview'
import { EvidenceBox } from './EvidenceBox'

import { getResultColor } from '@/shared/colors'
import type { Result } from '@/shared/results'

type Props = {
  result: Result
  index?: number
  displayIndex?: number
  isPinned?: boolean
  onTogglePin?: () => void
  isDisabled?: boolean
  onToggleDisable?: (ruleId: string) => void
  defaultExpanded?: boolean
  tabId?: number | null
  logUi?: (action: string, data?: Record<string, unknown>) => void
}

export const ResultCard = ({ result, index, displayIndex, isPinned, onTogglePin, isDisabled, onToggleDisable, defaultExpanded = false, tabId, logUi }: Props) => {
  const color = getResultColor(result.type)
  const isPending = result.type === 'pending'
  const hasDetails = Boolean(result.details || result.what || result.ruleId || typeof result.priority === 'number')
  const [open, setOpen] = useState(hasDetails && defaultExpanded)
  const snippet = extractSnippet(result.details)
  const { selectors, colors } = useMemo(() => buildDomHighlight(result), [result.details])
  const detailPayload = useMemo(() => buildDetailPayload(result.details), [result.details, snippet])
  useResultHighlight({ tabId, selectors, colors, open, ruleId: result.ruleId, logUi })
  const copyPayload = useMemo(() => toResultCopyPayload(result), [result])
  const numberLabel = typeof result.runIndex === 'number' ? result.runIndex : typeof displayIndex === 'number' ? displayIndex : typeof index === 'number' ? index + 1 : null

  const openReport = () => {
    if (!result.runIdentifier) return
    const target = numberLabel ?? 1
    chrome.tabs.create({ url: `${chrome.runtime.getURL('src/report.html')}?runid=${result.runIdentifier}#rule-index=${target}` })
    logUi?.('action:open-report-rule', { ruleId: result.ruleId, runId: result.runIdentifier, ruleIndex: target })
  }

  const toggleDisable = () => {
    if (!result.ruleId) return
    onToggleDisable?.(result.ruleId)
    logUi?.('action:toggle-rule', { ruleId: result.ruleId })
  }

  return (
    <article id={typeof numberLabel === 'number' ? `result-${numberLabel}` : undefined} className={`${color.full} border rounded p-3 space-y-2 ${isPending ? 'animate-pending' : ''}`} data-testid="result-card">
      <ResultHeader
        result={result}
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
      <MessageWithLinks text={result.message} className="text-sm text-slate-900 break-words" />
      {!open && <ResultPreview details={result.details} />}
      {open && hasDetails && (
        <div className="space-y-2">
          <ResultMetadata result={result} number={numberLabel} />
          {snippet && <EvidenceBox>{snippet}</EvidenceBox>}
          <ResultDetails details={detailPayload} />
        </div>
      )}
    </article>
  )
}
