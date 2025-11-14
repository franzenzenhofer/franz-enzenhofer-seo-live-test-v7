import { getActiveTabId } from '@/shared/chrome'
import { clearLogs } from '@/shared/logs'
import { clearResults } from '@/shared/results'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const executeRunNow = async () => {
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')

  await clearResults(tabId)
  await clearLogs(tabId)

  await chrome.tabs.reload(tabId, { bypassCache: true })
  await sleep(1200)

  await chrome.runtime.sendMessage({ type: 'panel:runNow', tabId })
}
