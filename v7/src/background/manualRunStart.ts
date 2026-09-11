import { clearTabSessionState } from './tabCleanup'

import { requestManualAudit } from '@/shared/auditIntent'
import { Logger } from '@/shared/logger'
import { resultsKey } from '@/shared/results'
import { writeRunMeta } from '@/shared/runMeta'

/**
 * Run test, background half. Runs BEFORE the panel navigates, so the click
 * itself - not the later nav:before side effect - kills everything known about
 * the tab: finalize alarm, run record, rule session, logs, nav ledger, audit
 * document, results. Then it records the intent the committed document will be
 * bound to (pipeline/manualRun.ts) and writes the visible `starting` state the
 * panel shows until the run seeds its pending rows.
 * `starting` is written BEFORE the results are removed: the panel watches both
 * keys separately, and zero results under the previous run's terminal status
 * renders the blank "No results yet. Click Run test" prompt (issue #1).
 */
export const beginManualRun = async (tabId: number, url: string): Promise<void> => {
  await clearTabSessionState(tabId, 'manual-run')
  await writeRunMeta(tabId, { url, ranAt: new Date().toISOString(), status: 'starting' })
  await chrome.storage.local.remove(resultsKey(tabId))
  await requestManualAudit(tabId)
  await Logger.logDirect(tabId, 'run', 'manual start', { url })
}

export const handleRunStart = (data: { tabId?: number; url?: string } | undefined, send?: (response: unknown) => void): boolean => {
  const tabId = data?.tabId
  if (!tabId) {
    send?.({ ok: false, error: 'Run start without a tab id' })
    return true
  }
  beginManualRun(tabId, data.url || '')
    .then(() => send?.({ ok: true }))
    .catch((error) => send?.({ ok: false, error: error instanceof Error ? error.message : String(error) }))
  return true
}
