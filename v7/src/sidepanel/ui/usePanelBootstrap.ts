import { useEffect } from 'react'

import { getActiveTabId, injectForTab } from '@/shared/chrome'
import { Logger } from '@/shared/logger'

type LogFn = (action: string, data?: Record<string, unknown>) => void

export const usePanelBootstrap = (logUi: LogFn) => {
  useEffect(() => {
    let cancelled = false
    getActiveTabId()
      .then(async (id) => {
        if (cancelled || !id) return
        Logger.setTabId(id)
        logUi('sidepanel:init', { tabId: id })
        try { await injectForTab(id) } catch { /* ignore */ }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [logUi])
}
