import { getActiveTabId } from '@/shared/chrome'
import { clearLogs } from '@/shared/logs'
import { clearResults } from '@/shared/results'
import { hardRefreshTab } from '@/shared/hardRefresh'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const executeRunNow = async () => {
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')

  await clearResults(tabId)
  await clearLogs(tabId)

  await hardRefreshTab(tabId)
  await sleep(1200)

  await chrome.runtime.sendMessage({ type: 'panel:runNow', tabId })
}
