import { useEffect } from 'react'

import { clearHighlight, highlightSelectors } from '@/shared/highlight'

type Params = {
  tabId?: number | null
  selectors: string[]
  colors?: string[]
  open: boolean
  ruleId?: string | null
  logUi?: (action: string, data?: Record<string, unknown>) => void
}

export const useResultHighlight = ({ tabId, selectors, colors, open, ruleId, logUi }: Params) => {
  useEffect(() => {
    if (!tabId) return
    if (!selectors.length) {
      logUi?.('highlight:not-selectable', { ruleId, reason: 'no-selector' })
      clearHighlight(tabId).catch(() => {})
      return
    }
    if (open) {
      let mounted = true
      highlightSelectors(tabId, selectors, colors).then((res) => {
        if (!mounted) return
        if (res.ok) {
          logUi?.('highlight:shown', { ruleId, selector: res.first, matched: res.matched })
        } else {
          logUi?.('highlight:not-selectable', { ruleId, selectors })
        }
      }).catch(() => {})
      return () => {
        mounted = false
        clearHighlight(tabId).catch(() => {})
      }
    }
    clearHighlight(tabId).catch(() => {})
  }, [tabId, selectors, open, ruleId, logUi])
}
