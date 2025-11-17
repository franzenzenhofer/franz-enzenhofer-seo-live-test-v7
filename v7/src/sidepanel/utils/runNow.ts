import { getActiveTabId } from '@/shared/chrome'
import { log } from '@/shared/logs'
import { clearResults } from '@/shared/results'
import { hardRefreshTab } from '@/shared/hardRefresh'
import { clearRunMeta } from '@/shared/runMeta'

export const executeRunNow = async (url?: string) => {
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')

  // Mark start of new test run in logs (do not clear logs)
  await log(tabId, '========== NEW TEST RUN STARTED ==========')

  await Promise.all([clearResults(tabId), clearRunMeta(tabId)])

  // Hard refresh will trigger DOM capture and rule execution automatically
  await hardRefreshTab(tabId, url)
}
