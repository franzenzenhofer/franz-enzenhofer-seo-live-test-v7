import { useEffect } from 'react'

export const useAutoScroll = (enabled: boolean, logs: string[]) => {
  useEffect(() => {
    if (!enabled) return
    const el = document.getElementById('logs-container')
    if (el) el.scrollTop = el.scrollHeight
  }, [enabled, logs])
}
