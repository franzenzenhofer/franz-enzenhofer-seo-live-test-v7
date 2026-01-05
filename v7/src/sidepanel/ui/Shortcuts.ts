import { useEffect } from 'react'

export const Shortcuts = ({
  runNow,
  clean,
  openLogs,
  openSettings,
  logsEnabled,
}: {
  runNow: () => void
  clean: () => void
  openLogs: () => void
  openSettings: () => void
  logsEnabled: boolean
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const tag = active?.tagName?.toLowerCase()
      const isTyping = active?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select'
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase()==='k') { e.preventDefault(); clean() }
      if (e.key==='Enter' && !isTyping) { runNow() }
      if (mod && e.key === '1') { e.preventDefault() }
      if (logsEnabled && mod && e.key === '2') { e.preventDefault(); openLogs() }
      if (mod && e.key === '3') { e.preventDefault(); openSettings() }
      if (mod && e.key.toLowerCase()==='f') {
        e.preventDefault()
        const el = document.querySelector<HTMLInputElement>('input[placeholder^="Filter results"]')
        el?.focus()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [runNow, clean, openLogs, openSettings, logsEnabled])
  return null
}
