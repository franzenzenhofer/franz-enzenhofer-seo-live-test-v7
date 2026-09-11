/**
 * A manual run ("Run test") is an intent the panel writes BEFORE it navigates.
 * The background binds it to the main-frame document that navigation commits
 * (background/pipeline/manualRun.ts) and the content script of that document
 * is the one that gets authorized - even with auto-run switched off.
 */
export type ManualAuditIntent = { requestedAt: number }
export type AuditDocument = { documentId: string; manual: boolean; skipped?: boolean }

export const manualAuditKey = (tabId: number) => `audit-manual:${tabId}`
export const auditDocumentKey = (tabId: number) => `audit-document:${tabId}`
export const MANUAL_AUDIT_TTL_MS = 30_000

export const requestManualAudit = async (tabId: number) => {
  await chrome.storage.session.set({ [manualAuditKey(tabId)]: { requestedAt: Date.now() } satisfies ManualAuditIntent })
}

/** An intent older than the TTL belongs to a click whose navigation never happened. */
export const isFreshManualIntent = (intent: ManualAuditIntent, now = Date.now()): boolean => {
  const age = now - intent.requestedAt
  return age >= 0 && age <= MANUAL_AUDIT_TTL_MS
}
