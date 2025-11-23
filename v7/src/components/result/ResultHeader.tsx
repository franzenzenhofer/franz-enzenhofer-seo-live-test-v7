import { CopyButton } from './CopyButton'
import { ResultActionsMenu } from './ResultActionsMenu'

import type { Result } from '@/shared/results'

type Props = {
  result: Result
  index?: number
  isPinned?: boolean
  onTogglePin?: () => void
  onToggleDisable?: () => void
  canToggleDetails: boolean
  open: boolean
  onToggleDetails?: () => void
  dotClass: string
  copyContent: string
  disabled?: boolean
  onOpenReport?: () => void
}

export const ResultHeader = ({
  result,
  index,
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
  return (
    <header className="flex items-center gap-2 text-xs">
      <span className={`${dotClass} w-2 h-2 rounded-full`} />
      <span className="font-semibold text-slate-900 flex-1 break-words flex items-center gap-1.5">
        {result.label}: {result.name}
        {result.what && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-blue-100 text-blue-800">
            {result.what}
          </span>
        )}
      </span>
      {typeof index === 'number' && (
        <span className="text-[10px] text-slate-500">#{index + 1}</span>
      )}
      <div className="flex items-center gap-1">
        {canToggleDetails && (
        <button
          type="button"
          className="text-xs px-2 py-0.5 border rounded bg-white/60 text-slate-700"
          onClick={onToggleDetails}
        >
          {open ? 'Hide' : 'Details'}
        </button>
        )}
        <CopyButton content={copyContent} />
        <ResultActionsMenu
          isPinned={isPinned}
          disabled={disabled}
          onTogglePin={onTogglePin}
          onToggleDisable={onToggleDisable}
          onOpenReport={onOpenReport}
        />
      </div>
    </header>
  )
}
