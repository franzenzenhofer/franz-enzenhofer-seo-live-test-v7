import { executeRunNow } from '../utils/runNow'
import { openLogsTab } from '../utils/openLogs'

import { clearLogs } from '@/shared/logs'
import { clearResults } from '@/shared/results'
import { getActiveTabId } from '@/shared/chrome'

type LogFn = (action: string, data?: Record<string, unknown>) => void

export const usePanelActions = (logUi: LogFn) => {
  const runNow = () => {
    logUi('action:run-now')
    executeRunNow().catch((err) => {
      console.warn('[panel] Run now shortcut failed', err)
      logUi('action:run-now-error', { error: String(err) })
    })
  }
  const clean = async () => {
    const id = await getActiveTabId()
    logUi('action:clean:start', { tabId: id || 'none' })
    if (id) {
      await clearResults(id)
      await clearLogs(id)
      logUi('action:clean:done', { tabId: id })
    }
  }
  const openSettings = () => {
    logUi('action:open-settings')
    const url = chrome.runtime.getURL('src/settings.html')
    chrome.tabs.create({ url })
  }
  const openReport = async () => {
    const tabId = await getActiveTabId()
    logUi('action:open-report', { tabId: tabId || 'none' })
    const base = chrome.runtime.getURL('src/report.html')
    const url = tabId ? `${base}?tabId=${tabId}` : base
    chrome.tabs.create({ url })
  }
  const openLogs = () => { logUi('action:open-logs-view'); void openLogsTab() }
  return { runNow, clean, openSettings, openReport, openLogs }
}
