import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authorizeAudit, isAuthorizedDocument } from '@/background/pipeline/auditAccess'
import { manualAuditKey } from '@/shared/auditIntent'

const local: Record<string, unknown> = {}
const session: Record<string, unknown> = {}
let currentDocumentId = 'doc-1'

const sender = (over: Partial<chrome.runtime.MessageSender> = {}): chrome.runtime.MessageSender => ({
  tab: { id: 7, active: true } as chrome.tabs.Tab,
  frameId: 0,
  documentId: 'doc-1',
  url: 'https://example.test/page',
  ...over,
})

beforeEach(() => {
  Object.keys(local).forEach((k) => delete local[k])
  Object.keys(session).forEach((k) => delete session[k])
  currentDocumentId = 'doc-1'
  const area = (store: Record<string, unknown>) => ({
    get: async (keys: string | string[]) => Object.fromEntries(
      (Array.isArray(keys) ? keys : [keys]).map((k) => [k, store[k]])),
    set: async (o: Record<string, unknown>) => { Object.assign(store, o) },
    remove: async (k: string) => { delete store[k] },
  })
  vi.stubGlobal('chrome', {
    storage: { local: area(local), session: area(session) },
    webNavigation: { getFrame: async () => ({ documentId: currentDocumentId }) },
  })
})

describe('audit authorization', () => {
  it('authorizes the active top-frame document when auto-run is on', async () => {
    expect(await authorizeAudit(sender())).toBe(true)
    expect(await isAuthorizedDocument(sender())).toBe(true)
  })

  it('refuses a subframe, an inactive tab and a superseded document', async () => {
    expect(await authorizeAudit(sender({ frameId: 1 }))).toBe(false)
    expect(await authorizeAudit(sender({ tab: { id: 7, active: false } as chrome.tabs.Tab }))).toBe(false)
    currentDocumentId = 'doc-2'
    expect(await authorizeAudit(sender())).toBe(false)
  })

  it('refuses a blocklisted URL before any rule work is authorized', async () => {
    expect(await authorizeAudit(sender({ url: 'https://www.google.com/search?q=x' }))).toBe(false)
  })

  it('refuses non-http documents', async () => {
    expect(await authorizeAudit(sender({ url: 'chrome://newtab/' }))).toBe(false)
  })

  it('does not authorize automatic runs when auto-run is off', async () => {
    local['ui:autoRun'] = false
    expect(await authorizeAudit(sender())).toBe(false)
    expect(await isAuthorizedDocument(sender())).toBe(false)
  })

  it('honours one manual run while auto-run is off, and consumes the intent', async () => {
    local['ui:autoRun'] = false
    session[manualAuditKey(7)] = { requestedAt: Date.now() }
    expect(await authorizeAudit(sender())).toBe(true)
    expect(session[manualAuditKey(7)]).toBeUndefined()
    // A later document in the same tab gets no free ride from the spent intent.
    currentDocumentId = 'doc-2'
    expect(await authorizeAudit(sender({ documentId: 'doc-2' }))).toBe(false)
  })

  it('ignores a manual intent that has expired', async () => {
    local['ui:autoRun'] = false
    session[manualAuditKey(7)] = { requestedAt: Date.now() - 60_000 }
    expect(await authorizeAudit(sender())).toBe(false)
  })
})
