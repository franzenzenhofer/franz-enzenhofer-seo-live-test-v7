export const manualAuditKey = (tabId: number) => `audit-manual:${tabId}`
export const auditDocumentKey = (tabId: number) => `audit-document:${tabId}`
export const MANUAL_AUDIT_TTL_MS = 30_000

export const requestManualAudit = async (tabId: number) => {
  await chrome.storage.session.set({ [manualAuditKey(tabId)]: { requestedAt: Date.now() } })
}
