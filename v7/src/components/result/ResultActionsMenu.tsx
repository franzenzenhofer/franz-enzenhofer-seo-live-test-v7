import { useEffect, useRef, useState } from 'react'

type Props = {
  isPinned?: boolean
  disabled?: boolean
  onTogglePin?: () => void
  onToggleDisable?: () => void
  onOpenReport?: () => void
}

export const ResultActionsMenu = ({ isPinned, disabled, onTogglePin, onToggleDisable, onOpenReport }: Props) => {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  const toggle = () => setOpen((v) => !v)
  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (wrapperRef.current && event.target instanceof Node && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        className="px-2 py-1 text-slate-600 hover:text-slate-900"
        onClick={toggle}
        aria-label="Result actions"
        aria-expanded={open}
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
