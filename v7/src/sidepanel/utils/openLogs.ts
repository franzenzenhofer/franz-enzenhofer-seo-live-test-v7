import { getActiveTabId } from '@/shared/chrome'
import { Logger } from '@/shared/logger'

export const openLogsTab = async () => {
  try {
    const tabId = await getActiveTabId()
    Logger.log('ui', 'open-logs-tab', { tabId }).catch(() => {})
    // Open logs without tabId parameter - shows all logs
    const url = chrome.runtime.getURL('src/logs.html')
    await chrome.tabs.create({ url })
  } catch (err) {
    console.warn('[panel] Failed to open logs', err)
    Logger.log('ui', 'open-logs-tab-error', { error: String(err) }).catch(() => {})
    const url = chrome.runtime.getURL('src/logs.html')
    chrome.tabs.create({ url })
  }
}
