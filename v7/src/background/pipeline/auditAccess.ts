import { CMS_BACKEND_RULE, recordSkippedRun } from '../rules/skippedRun'

import { serializePerTab } from './tabSerial'

import { auditDocumentKey, manualAuditKey, MANUAL_AUDIT_TTL_MS } from '@/shared/auditIntent'
import { isUrlBlocked } from '@/shared/blocklist'
import { pageSkipMessage, unsafePageReason } from '@/shared/probeSafety'
import { resultsKey } from '@/shared/results'

type AuditDocument = { documentId: string; manual: boolean; skipped?: boolean }

const currentSender = async (sender: chrome.runtime.MessageSender) => {
  if (!sender.tab?.id || !sender.tab.active || sender.frameId !== 0 || !sender.documentId || !sender.url) return false
  if (!/^https?:\/\//.test(sender.url)) return false
  const current = await chrome.webNavigation.getFrame({ tabId: sender.tab.id, frameId: 0 })
  return current?.documentId === sender.documentId
}

export const authorizeAudit = async (sender: chrome.runtime.MessageSender): Promise<boolean> => {
  if (!await currentSender(sender) || (await isUrlBlocked(sender.url!)).blocked) return false
  const tabId = sender.tab!.id!
  const unsafe = unsafePageReason(sender.url!)
  return serializePerTab(tabId, async () => {
    const key = auditDocumentKey(tabId)
    const manualKey = manualAuditKey(tabId)
    const [settings, stored] = await Promise.all([
      chrome.storage.local.get('ui:autoRun'), chrome.storage.session.get([key, manualKey]),
    ])
    const prior = stored[key] as AuditDocument | undefined
    if (unsafe) {
      // Both capture phases ask; the refusal is recorded once per document.
      if (prior?.documentId !== sender.documentId) {
        await chrome.storage.session.set({ [key]: { documentId: sender.documentId, manual: false, skipped: true } })
        const result = { ...CMS_BACKEND_RULE, message: pageSkipMessage(unsafe) }
        await recordSkippedRun({ tabId, url: sender.url!, resultsKey: resultsKey(tabId), result })
      }
      return false
    }
    const intent = stored[manualKey] as { requestedAt?: number } | undefined
    const age = Date.now() - (intent?.requestedAt ?? 0)
    const manual = (prior?.documentId === sender.documentId && prior?.manual) || (age >= 0 && age <= MANUAL_AUDIT_TTL_MS)
    if (settings['ui:autoRun'] === false && !manual) return false
    await chrome.storage.session.set({ [key]: { documentId: sender.documentId, manual } })
    if (intent) await chrome.storage.session.remove(manualKey)
    return true
  })
}

export const isAuthorizedDocument = async (sender: chrome.runtime.MessageSender): Promise<boolean> => {
  if (!await currentSender(sender)) return false
  const key = auditDocumentKey(sender.tab!.id!)
  const stored = await chrome.storage.session.get(key)
  const doc = stored[key] as AuditDocument | undefined
  return doc?.documentId === sender.documentId && !doc?.skipped
}
