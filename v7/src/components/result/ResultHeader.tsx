import { CopyButton } from './CopyButton'
import { ResultActionsMenu } from './ResultActionsMenu'

import type { Result } from '@/shared/results'

type Props = { result: Result; isPinned?: boolean; onTogglePin?: () => void; onToggleDisable?: () => void; canToggleDetails: boolean; open: boolean; onToggleDetails?: () => void; dotClass: string; copyContent: string; disabled?: boolean; onOpenReport?: () => void }

export const ResultHeader = ({
  result,
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
  return (
    <header className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-2">
        {isPinned ? (
          <span className={`${accentClass} text-sm leading-none`} title="Favorited rule" aria-hidden="true">★</span>
        ) : (
          <span className={`${dotClass} w-2 h-2 rounded-full`} />
        )}
        <span className="font-semibold text-slate-900 flex-1 break-words">{result.label}: {result.name}</span>
        {canToggleDetails && (
          <button type="button" className="text-xs px-2 py-0.5 border rounded bg-white/60 text-slate-700" onClick={onToggleDetails}>
            {open ? 'Hide' : 'Details'}
          </button>
        )}
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
    </header>
  )
}
