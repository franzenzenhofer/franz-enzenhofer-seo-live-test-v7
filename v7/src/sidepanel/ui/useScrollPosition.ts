import { useEffect, useRef } from 'react'

export const useScrollPosition = (tabId: number | null) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const key = tabId ? `ui:scroll:${tabId}` : null

  useEffect(() => {
    if (!key || !containerRef.current) return
    let cancelled = false
    chrome.storage.session.get(key).then((res) => {
      if (cancelled || !containerRef.current) return
      const pos = (res[key] as number) || 0
      containerRef.current.scrollTop = pos
    }).catch(() => {})
    return () => { cancelled = true }
  }, [key])

  useEffect(() => {
    if (!key || !containerRef.current) return
    const el = containerRef.current
    let timeout: ReturnType<typeof setTimeout>
    const save = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        chrome.storage.session.set({ [key]: el.scrollTop }).catch(() => {})
      }, 150)
    }
    el.addEventListener('scroll', save, { passive: true })
    return () => { clearTimeout(timeout); el.removeEventListener('scroll', save) }
  }, [key])

  return containerRef
}
