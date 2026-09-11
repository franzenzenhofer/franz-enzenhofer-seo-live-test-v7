import { useId, useState } from 'react'

import { Actions } from './Actions'
import { CopyResult } from './CopyResult'
import { Details } from './Details'
import { Fields } from './Fields'
import { Icon } from './Icon'
import { actionClass, statusIcons } from './styles'

import type { ResultCardProps } from '@/components/result/LegacyResultCard'
import { getResultColor } from '@/shared/colors'
import { textField } from '@/shared/presentation/create'
import { presentationCopy } from '@/shared/presentation/copy'

export const PresentationCard = ({ result, index, displayIndex, defaultExpanded = false, isPinned, onTogglePin, isDisabled, onToggleDisable, logUi }: ResultCardProps) => {
  const [open, setOpen] = useState(defaultExpanded)
  const id = useId(), view = result.presentation!
  const number = result.runIndex ?? displayIndex ?? (index === undefined ? undefined : index + 1)
  const color = getResultColor(result.type), [glyph, status] = statusIcons[result.type]
  const report = result.runIdentifier ? () => {
    chrome.tabs.create({ url: `${chrome.runtime.getURL('src/report.html')}?runid=${encodeURIComponent(result.runIdentifier!)}#rule-index=${number ?? 1}` }).catch(() => logUi?.('action:open-report-failed'))
  } : undefined
  const disable = result.ruleId && onToggleDisable ? () => onToggleDisable(result.ruleId!) : undefined
  return <article id={number === undefined ? undefined : `result-${number}`} data-testid="result-card" data-presentation-version="1" className={`relative rounded-xl border ${color.full}`}>
    <header className="flex items-start gap-2 px-3 pt-2">
      <span className={`mt-1 ${color.text}`}><Icon name={glyph} label={status} className={result.type === 'pending' ? 'h-5 w-5 motion-safe:animate-spin' : 'h-5 w-5'} /></span>
      <h2 className="min-w-0 flex-1 pt-0.5 text-base font-semibold leading-6 text-slate-950 [overflow-wrap:anywhere]">{view.name}{isPinned && <Icon name="star" label="Favorited" className="ml-1 inline-block h-4 w-4 fill-amber-400 text-amber-600" />}</h2>
      <CopyResult content={presentationCopy({ ...result, runIndex: number })} />
      <button type="button" className={actionClass} aria-expanded={open} aria-controls={id} aria-label={open ? 'Hide details' : 'Show details'} title={open ? 'Hide details' : 'Show details'} onClick={() => setOpen(!open)}><Icon name={open ? 'minimize-2' : 'maximize-2'} /></button>
      <Actions favorite={isPinned} disabled={isDisabled} onFavorite={onTogglePin} onDisable={disable} onReport={report} />
    </header>
    <div className="px-3 pb-2 pt-1.5"><Fields fields={[...(isDisabled && result.type !== 'disabled' ? [textField('Next run', 'Disabled')] : []), ...view.values]} pageUrl={view.pageUrl} /></div>
    <p hidden={open} data-testid="checked-input" className="px-3 pb-2 text-right text-xs leading-4 text-slate-500 [overflow-wrap:anywhere]"><span className="sr-only">Checked input: </span>{view.input}</p>
    <div id={id} hidden={!open} className="space-y-2 border-t border-slate-200/80 px-3 py-2.5"><Fields fields={[textField('Checked input', view.input)]} pageUrl={view.pageUrl} /><Details view={view} result={{ ...result, runIndex: number }} /></div>
  </article>
}
