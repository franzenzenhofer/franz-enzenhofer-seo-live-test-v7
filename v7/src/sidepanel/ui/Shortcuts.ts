import { useEffect } from 'react'

export const Shortcuts = ({
  runNow,
  clean,
  openLogs,
  openSettings,
}: {
  runNow: () => void
  clean: () => void
  openLogs: () => void
  openSettings: () => void
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase()==='k') { e.preventDefault(); clean() }
      if (e.key==='Enter') { runNow() }
      if (mod && e.key === '1') { e.preventDefault() }
      if (mod && e.key === '2') { e.preventDefault(); openLogs() }
      if (mod && e.key === '3') { e.preventDefault(); openSettings() }
      if (mod && e.key.toLowerCase()==='f') { const el = document.querySelector<HTMLInputElement>('input[placeholder^="Filter results"]'); el?.focus() }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [runNow, clean, openLogs, openSettings])
  return null
}
