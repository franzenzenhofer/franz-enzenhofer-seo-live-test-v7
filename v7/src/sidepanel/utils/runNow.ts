import { getActiveTabId } from '@/shared/chrome'
import { log } from '@/shared/logs'
import { clearResults } from '@/shared/results'
import { hardRefreshTab } from '@/shared/hardRefresh'
import { generateRunId, setActiveRunId, cancelActiveRun } from '@/shared/activeRun'

export const executeRunNow = async (url?: string): Promise<string> => {
  const tabId = await getActiveTabId()
  if (!tabId) throw new Error('No active tab')

  // Cancel any existing active run
  await cancelActiveRun(tabId)

  // Generate and set new run ID BEFORE clearing results
  const runId = generateRunId()
  await setActiveRunId(tabId, runId)

  // Mark start of new test run in logs (do not clear logs)
  await log(tabId, `========== NEW TEST RUN STARTED (${runId}) ==========`)

  await clearResults(tabId)

  // Hard refresh will trigger DOM capture and rule execution automatically
  await hardRefreshTab(tabId, url)

  return runId
}
