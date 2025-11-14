import { getActiveTabId } from '@/shared/chrome'

export const openLogsTab = async () => {
  try {
    const tabId = await getActiveTabId()
    const params = tabId ? `?tabId=${tabId}` : ''
    const url = chrome.runtime.getURL(`src/logs.html${params}`)
    await chrome.tabs.create({ url })
  } catch (err) {
    console.warn('[panel] Failed to open logs', err)
    const url = chrome.runtime.getURL('src/logs.html')
    chrome.tabs.create({ url })
  }
}
