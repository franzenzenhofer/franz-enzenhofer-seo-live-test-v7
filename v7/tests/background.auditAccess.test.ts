import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authorizeAudit, isAuthorizedDocument } from '@/background/pipeline/auditAccess'
import { bindManualRun } from '@/background/pipeline/manualRun'
import { auditDocumentKey, manualAuditKey } from '@/shared/auditIntent'

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
    // bindManualRun arms the manual-run watchdog (background.manualRun.watchdog.test.ts covers it).
    alarms: { clear: async () => true, create: async () => {} },
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

  it('refuses a CMS back office and tells the panel why, once per document', async () => {
    const admin = sender({ url: 'https://example.test/wp-admin/edit.php' })
    expect(await authorizeAudit(admin)).toBe(false)
    const first = local['results-meta:7'] as { runId: string; status: string }
    expect(await authorizeAudit(admin)).toBe(false)
    expect(await isAuthorizedDocument(admin)).toBe(false)
    expect(local['results:7']).toEqual([expect.objectContaining({
      ruleId: 'system:cms-backend', type: 'info', message: expect.stringMatching(/^Not tested: WordPress admin/),
    })])
    expect(first.status).toBe('skipped')
    expect((local['results-meta:7'] as { runId: string }).runId).toBe(first.runId)
  })

  it('refuses non-http documents', async () => {
    expect(await authorizeAudit(sender({ url: 'chrome://newtab/' }))).toBe(false)
  })

  it('does not authorize automatic runs when auto-run is off', async () => {
    local['ui:autoRun'] = false
    expect(await authorizeAudit(sender())).toBe(false)
    expect(await isAuthorizedDocument(sender())).toBe(false)
  })

  it('authorizes the document the manual run was bound to while auto-run is off, for both phases', async () => {
    local['ui:autoRun'] = false
    session[manualAuditKey(7)] = { requestedAt: Date.now() }
    expect(await bindManualRun(7, 'doc-1')).toBe(true)
    expect(await authorizeAudit(sender())).toBe(true)
    expect(session[manualAuditKey(7)]).toBeUndefined()
    // document_idle asks again for the same document: still the manual document.
    expect(await authorizeAudit(sender())).toBe(true)
    expect(await isAuthorizedDocument(sender())).toBe(true)
    expect((session['run:7'] as { manual?: boolean }).manual).toBe(true)
    // A later document in the same tab gets no free ride from the spent intent.
    currentDocumentId = 'doc-2'
    expect(await authorizeAudit(sender({ documentId: 'doc-2' }))).toBe(false)
  })

  it('never lets a document that merely asks first claim the intent: only the committed document is bound', async () => {
    local['ui:autoRun'] = false
    session[manualAuditKey(7)] = { requestedAt: Date.now() }
    // No nav:commit yet - the intent alone authorizes nothing and is kept for the load.
    expect(await authorizeAudit(sender())).toBe(false)
    expect(session[manualAuditKey(7)]).toBeDefined()
    await bindManualRun(7, 'doc-2')
    // The stale document is still the frame's current one for a moment, but doc-2 holds the binding.
    expect(await authorizeAudit(sender())).toBe(false)
    currentDocumentId = 'doc-2'
    expect(await authorizeAudit(sender({ documentId: 'doc-2' }))).toBe(true)
  })

  it('keeps the intent across a redirect that replaces the bound document before it asked', async () => {
    local['ui:autoRun'] = false
    session[manualAuditKey(7)] = { requestedAt: Date.now() }
    await bindManualRun(7, 'doc-1')
    // nav:before of the redirect target drops the binding (clearTabSessionState), the commit binds again.
    delete session[auditDocumentKey(7)]
    expect(await bindManualRun(7, 'doc-2')).toBe(true)
    currentDocumentId = 'doc-2'
    expect(await authorizeAudit(sender({ documentId: 'doc-2' }))).toBe(true)
  })

  it('drops a manual intent that has expired instead of binding it', async () => {
    local['ui:autoRun'] = false
    session[manualAuditKey(7)] = { requestedAt: Date.now() - 60_000 }
    expect(await bindManualRun(7, 'doc-1')).toBe(false)
    expect(session[manualAuditKey(7)]).toBeUndefined()
    expect(await authorizeAudit(sender())).toBe(false)
  })

  it('records the CMS refusal for a bound manual document too', async () => {
    session[manualAuditKey(7)] = { requestedAt: Date.now() }
    await bindManualRun(7, 'doc-1')
    expect(await authorizeAudit(sender({ url: 'https://example.test/wp-admin/edit.php' }))).toBe(false)
    expect((local['results-meta:7'] as { status: string }).status).toBe('skipped')
  })
})
