import type { Result } from '@/shared/results'

type Props = {
  result: Result
  index?: number
  isPinned?: boolean
  onTogglePin?: () => void
  canToggleDetails: boolean
  open: boolean
  onToggleDetails?: () => void
  dotClass: string
}

export const ResultHeader = ({
  result,
  index,
  isPinned,
  onTogglePin,
  canToggleDetails,
  open,
  onToggleDetails,
  dotClass,
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
      {onTogglePin && (
        <button
          type="button"
          className={`text-sm ${isPinned ? 'text-yellow-500' : 'text-slate-400'} hover:text-yellow-500`}
          onClick={onTogglePin}
          title={isPinned ? 'Unpin rule' : 'Pin rule'}
        >
          {isPinned ? '★' : '☆'}
        </button>
      )}
      {canToggleDetails && (
        <button
          type="button"
          className="text-xs px-2 py-0.5 border rounded bg-white/60 text-slate-700"
          onClick={onToggleDetails}
        >
          {open ? 'Hide' : 'Details'}
        </button>
      )}
    </header>
  )
}
