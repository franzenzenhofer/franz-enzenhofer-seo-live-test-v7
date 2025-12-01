import { useCallback, useEffect, useState } from 'react'

type ExpandedState = Record<string, boolean>

export const useExpandedCards = (tabId: number | null) => {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const key = tabId ? `ui:expanded:${tabId}` : null

  useEffect(() => {
    if (!key) return
    let cancelled = false
    chrome.storage.session.get(key).then((res) => {
      if (cancelled) return
      setExpanded((res[key] as ExpandedState) || {})
    }).catch(() => {})
    return () => { cancelled = true }
  }, [key])

  useEffect(() => {
    if (!key) return
    chrome.storage.session.set({ [key]: expanded }).catch(() => {})
  }, [key, expanded])

  const isExpanded = useCallback((ruleId: string) => expanded[ruleId] ?? false, [expanded])
  const toggleExpanded = useCallback((ruleId: string) => {
    setExpanded((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }))
  }, [])

  return { isExpanded, toggleExpanded }
}
