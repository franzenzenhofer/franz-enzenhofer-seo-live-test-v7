import { recordSkippedRun } from '../rules/skippedRun'
import { derivePageUrl } from '../rules/util'

import { scheduleFinalize } from './alarms'
import { markManualRun, resetRun } from './store'
import type { Run } from './types'

import { auditDocumentKey, isFreshManualIntent, manualAuditKey, type AuditDocument, type ManualAuditIntent } from '@/shared/auditIntent'
import { Logger } from '@/shared/logger'
import { resultsKey } from '@/shared/results'

/**
 * A manual run knows a fresh document is coming, so it may not wait forever
 * for phases that never arrive (no content script on an error page or viewer,
 * a load that never finishes). The watchdog is armed at the commit; a phase
 * that lands re-arms finalize itself (markDomPhase), so it only fires when
 * nothing landed at all - then finalizeTab writes the terminal state below.
 */
export const MANUAL_RUN_WATCHDOG_MS = 15_000
export const NO_PAGE_REPORT_RULE = { ruleId: 'system:no-page-report', what: 'Run test' } as const

/**
 * Binds a pending Run test intent to the document the navigation actually
 * loads. The panel writes the intent, then navigates once; the main-frame
 * nav:commit of that navigation names the ONE document (documentId) whose
 * content script may audit - a stale document that asks first gets nothing,
 * and neither does a document that commits after the intent expired.
 * The intent itself is consumed when that document is authorized
 * (auditAccess.ts), so a client-side redirect before the content script asks
 * carries it to the replacement document instead of losing the run.
 */
export const bindManualRun = async (tabId: number, documentId: string): Promise<boolean> => {
  const key = manualAuditKey(tabId)
  const stored = await chrome.storage.session.get(key)
  const intent = stored[key] as ManualAuditIntent | undefined
  if (!intent) return false
  if (!isFreshManualIntent(intent)) {
    await chrome.storage.session.remove(key)
    await Logger.logDirect(tabId, 'nav', 'manual intent expired', { requestedAt: intent.requestedAt, documentId })
    return false
  }
  const bound: AuditDocument = { documentId, manual: true }
  await chrome.storage.session.set({ [auditDocumentKey(tabId)]: bound })
  await markManualRun(tabId)
  await Logger.logDirect(tabId, 'nav', 'manual run bound', { documentId, watchdog: `${MANUAL_RUN_WATCHDOG_MS}ms` })
  await scheduleFinalize(tabId, MANUAL_RUN_WATCHDOG_MS)
  return true
}

/** Terminal, visible state for a manual run whose document never reported a phase. */
export const settleUnreportedManualRun = async (tabId: number, run: Run): Promise<void> => {
  const url = derivePageUrl(run.ev)
  await resetRun(tabId)
  const seconds = Math.round(MANUAL_RUN_WATCHDOG_MS / 1000)
  const message = `Not tested: the page did not report back within ${seconds} s of Run test - no content script ran `
    + '(error page, unsupported document or a load that never finished). Click Run test again.'
  await recordSkippedRun({ tabId, url, resultsKey: resultsKey(tabId), result: { ...NO_PAGE_REPORT_RULE, message } })
  await Logger.logDirect(tabId, 'alarm', 'manual run unreported', { url: url || 'no-url', events: run.ev.length })
}
