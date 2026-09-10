import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { Icon } from './Icon'
import { actionClass } from './styles'

type Props = { favorite?: boolean; disabled?: boolean; onFavorite?: () => void; onDisable?: () => void; onReport?: () => void }
export const Actions = ({ favorite, disabled, onFavorite, onDisable, onReport }: Props) => {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const close = (focus = true) => { setOpen(false); if (focus) trigger.current?.focus() }
  const items = () => Array.from(wrapper.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') || [])
  useEffect(() => {
    if (!open) return
    items()[0]?.focus()
    const outside = (event: MouseEvent) => { if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])
  const navigate = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (event.key === 'Tab') { close(false); return }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = items(), current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }
  const options = [
    { label: favorite ? 'Unfavorite' : 'Favorite', run: onFavorite },
    { label: disabled ? 'Enable rule' : 'Disable rule', run: onDisable },
    { label: 'Open in full report', run: onReport },
  ]
  return <div className="relative shrink-0" ref={wrapper}>
    <button ref={trigger} type="button" className={actionClass} aria-label="Result actions" aria-haspopup="menu" aria-expanded={open} aria-controls={id}
      onClick={() => setOpen(!open)} onKeyDown={(event) => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true) } }}><Icon name="ellipsis-vertical" /></button>
    {open && <div id={id} role="menu" aria-label="Result actions" onKeyDown={navigate} className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
      {options.map(({ label, run }) => <button key={label} type="button" role="menuitem" tabIndex={-1} disabled={!run} title={!run ? 'Unavailable in this view' : undefined}
        className="flex w-full rounded px-2 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:text-slate-400"
        onClick={() => { run?.(); close() }}>{label}</button>)}
    </div>}
  </div>
}
