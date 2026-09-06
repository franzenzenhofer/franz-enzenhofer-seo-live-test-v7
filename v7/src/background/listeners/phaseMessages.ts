import { pushEvent, markDomPhase, flushCollection } from '../pipeline/collector'
import { isAuthorizedDocument, authorizeAudit } from '../pipeline/auditAccess'

import { validatePhaseMessage } from '@/shared/phaseContract'
import { logSystem } from '@/shared/logs'

export const handleAuditMessage = (
  message: { type?: string; event?: string; data?: unknown },
  sender: chrome.runtime.MessageSender,
  send?: (response: unknown) => void,
) => {
  if (message.type === 'audit:eligibility') {
    flushCollection(sender.tab?.id || 0).then(() => authorizeAudit(sender))
      .then((allowed) => send?.({ allowed })).catch(() => send?.({ allowed: false }))
    return true
  }
  if (!message.event) return false
  const event = message.event
  const data = message.data
  const ingest = async () => {
    const contract = validatePhaseMessage(event, data)
    if (!contract.ok) throw new Error(contract.reason)
    if (!await isAuthorizedDocument(sender)) throw new Error('document is not authorized')
    const tabId = sender.tab!.id!
    await pushEvent(tabId, { t: `dom:${event}`, u: (data as { url: string }).url, documentId: sender.documentId, d: data })
    if (event === 'document_idle') await markDomPhase(tabId, sender.documentId)
    send?.({ accepted: true })
  }
  ingest().catch((error) => {
    logSystem(`runtime:reject-phase reason=${String(error)}`).catch(() => {})
    send?.({ accepted: false })
  })
  return true
}
