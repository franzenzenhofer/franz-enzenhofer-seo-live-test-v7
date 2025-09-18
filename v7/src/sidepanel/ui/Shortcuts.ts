import { useEffect } from 'react'

export const Shortcuts = ({ runNow, clean, setTab }: { runNow: ()=>void; clean: ()=>void; setTab: (t: 'results'|'report'|'logs'|'settings')=>void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase()==='k') { e.preventDefault(); clean() }
      if (e.key==='Enter') { runNow() }
      if (mod && ['1','2','3','4'].includes(e.key)) {
        e.preventDefault(); const idx = Number(e.key)-1; const tabs: Array<'results'|'report'|'logs'|'settings'> = ['results','report','logs','settings']; const t = tabs[idx]; if (t) setTab(t)
      }
      if (mod && e.key.toLowerCase()==='f') { const el = document.querySelector<HTMLInputElement>('input[placeholder^="Filter results"]'); el?.focus() }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [runNow, clean, setTab])
  return null
}
