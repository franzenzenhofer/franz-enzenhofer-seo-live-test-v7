import { CopyButton } from './CopyButton'
import { ResultActionsMenu } from './ResultActionsMenu'

import type { Result } from '@/shared/results'

type Props = { result: Result; index?: number; displayIndex?: number; isPinned?: boolean; onTogglePin?: () => void; onToggleDisable?: () => void; canToggleDetails: boolean; open: boolean; onToggleDetails?: () => void; dotClass: string; copyContent: string; disabled?: boolean; onOpenReport?: () => void }

export const ResultHeader = ({
  result,
  index,
  displayIndex,
  isPinned,
  onTogglePin,
  onToggleDisable,
  canToggleDetails,
  open,
  onToggleDetails,
  dotClass,
  copyContent,
  disabled,
  onOpenReport,
}: Props) => {
  const accentClass = dotClass.replace('bg-', 'text-')
  const numberLabel = typeof displayIndex === 'number' ? displayIndex : typeof index === 'number' ? index + 1 : null
  return (
    <header className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-2">
        {isPinned ? (
          <span className={`${accentClass} text-sm leading-none`} title="Favorited rule" aria-hidden="true">★</span>
        ) : (
          <span className={`${dotClass} w-2 h-2 rounded-full`} />
        )}
        <span className="font-semibold text-slate-900 flex-1 break-words">{result.label}: {result.name}</span>
        <div className="flex items-center gap-1">
          <CopyButton content={copyContent} />
          <ResultActionsMenu
            isPinned={isPinned}
            disabled={disabled}
            onTogglePin={onTogglePin}
            onToggleDisable={onToggleDisable}
            onOpenReport={onOpenReport}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {result.what && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-blue-100 text-blue-800">
              {result.what}
            </span>
          )}
          {typeof result.priority === 'number' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-slate-100 text-slate-600" title="Priority score">
              P{result.priority}
            </span>
          )}
          {numberLabel !== null && <span className="text-[10px] text-slate-500">#{numberLabel}</span>}
          {result.ruleId && (
            <span className="text-[10px] text-slate-500 font-mono" title="Rule ID">
              {result.ruleId}
            </span>
          )}
        </div>
        {canToggleDetails && (
          <button
            type="button"
            className="text-xs px-2 py-0.5 border rounded bg-white/60 text-slate-700"
            onClick={onToggleDetails}
          >
            {open ? 'Hide' : 'Details'}
          </button>
        )}
      </div>
    </header>
  )
}
