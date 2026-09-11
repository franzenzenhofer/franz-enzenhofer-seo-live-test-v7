import { markManualRun } from './store'

import { auditDocumentKey, isFreshManualIntent, manualAuditKey, type AuditDocument, type ManualAuditIntent } from '@/shared/auditIntent'
import { Logger } from '@/shared/logger'

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
  await Logger.logDirect(tabId, 'nav', 'manual run bound', { documentId })
  return true
}
