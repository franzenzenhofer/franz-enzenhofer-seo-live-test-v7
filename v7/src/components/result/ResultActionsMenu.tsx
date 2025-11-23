import { useState } from 'react'

type Props = {
  isPinned?: boolean
  disabled?: boolean
  onTogglePin?: () => void
  onToggleDisable?: () => void
  onOpenReport?: () => void
}

export const ResultActionsMenu = ({ isPinned, disabled, onTogglePin, onToggleDisable, onOpenReport }: Props) => {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const toggle = () => setOpen((v) => !v)
  return (
    <div className="relative">
      <button
        type="button"
        className="px-2 py-1 text-slate-600 hover:text-slate-900"
        onClick={toggle}
        aria-label="Result actions"
      >
        ⋮
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-44 bg-white border rounded shadow-lg text-xs z-10"
          onMouseLeave={close}
        >
          <button className="w-full text-left px-3 py-2 hover:bg-slate-100" onClick={() => { onTogglePin?.(); close() }}>
            {isPinned ? 'Unfavorite' : 'Favorite'}
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-slate-100" onClick={() => { onToggleDisable?.(); close() }}>
            {disabled ? 'Enable rule' : 'Disable rule'}
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-slate-100" onClick={() => { onOpenReport?.(); close() }}>
            Open in full report
          </button>
        </div>
      )}
    </div>
  )
}
