import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Real store, collector and phase handler over an in-memory storage shim
// (pattern: background.lifecycle.race.test.ts). Only document authorization is
// stubbed: it is covered by background.auditAccess.test.ts.
const data: Record<string, unknown> = {}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const keys = (key: string | string[]) => (Array.isArray(key) ? key : [key])
type Listener = (details: Record<string, unknown>) => void
const requestListeners: Record<string, Listener> = {}
const webRequestEvent = (name: string) => ({ addListener: (listener: Listener) => { requestListeners[name] = listener } })
// @ts-expect-error test shim
globalThis.chrome = {
  storage: {
    session: {
      get: async (key: string) => { await tick(); return { [key]: data[key] } },
      set: async (obj: Record<string, unknown>) => { await tick(); Object.assign(data, obj) },
      remove: async (key: string | string[]) => { await tick(); for (const k of keys(key)) delete data[k] },
    },
    local: { get: async () => ({}), set: async () => {}, remove: async () => {} },
  },
  alarms: { onAlarm: { addListener: () => {} }, clear: async () => true, create: async () => {} },
  webRequest: Object.fromEntries(['onBeforeSendHeaders', 'onHeadersReceived', 'onBeforeRedirect', 'onCompleted', 'onErrorOccurred']
    .map((name) => [name, webRequestEvent(name)])),
}

vi.mock('@/background/pipeline/auditAccess', () => ({ isAuthorizedDocument: async () => true, authorizeAudit: async () => true }))

const { pushEvent, flushCollection } = await import('@/background/pipeline/collector')
const { popRun } = await import('@/background/pipeline/store')
const { registerRequestListeners } = await import('@/background/listeners/requests')
const { handleAuditMessage } = await import('@/background/listeners/phaseMessages')

const tabLog = (tabId: number) => (data[`logs:${tabId}`] as string[] | undefined) || []
const systemLog = () => (data['logs:0'] as string[] | undefined) || []
const aborted = (documentId: string) => ({ t: 'req:error', u: 'https://old.test/app.js', resourceType: 'script', documentId, error: 'net::ERR_ABORTED' })
const commit = async (tabId: number, documentId: string) => {
  expect(await pushEvent(tabId, { t: 'nav:before', u: 'https://new.test/' })).toBe(true)
  expect(await pushEvent(tabId, { t: 'nav:commit', u: 'https://new.test/', documentId })).toBe(true)
}

beforeEach(() => { for (const key of Object.keys(data)) delete data[key] })
afterEach(() => { vi.restoreAllMocks() })

describe('collector: stale events are dropped, not errors', () => {
  it('resolves false for a request on a tab without a run and never reports it as an error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    registerRequestListeners()
    requestListeners['onErrorOccurred']!({ tabId: 41, type: 'script', url: 'https://old.test/app.js', requestId: '7', error: 'net::ERR_ABORTED', documentId: 'doc-1' })
    await flushCollection(41)
    expect(await pushEvent(41, aborted('doc-1'))).toBe(false)
    expect(consoleError).not.toHaveBeenCalled()
    expect(tabLog(41).filter((line) => line.includes('event:drop'))).toHaveLength(2)
    expect(systemLog().some((line) => line.includes('drop'))).toBe(false)
    expect(data['run:41']).toBeUndefined()
  })

  it('drops the previous document\'s aborted request after commit and keeps the current one', async () => {
    await commit(42, 'doc-2')
    expect(await pushEvent(42, aborted('doc-1'))).toBe(false)
    expect(await pushEvent(42, { t: 'req:done', u: 'https://new.test/app.js', s: 200, documentId: 'doc-2' })).toBe(true)
    const run = await popRun(42)
    expect(run?.resources?.facts.map((fact) => fact.url)).toEqual(['https://new.test/app.js'])
    expect(run?.resources?.errors).toBe(0)
  })
})

describe('phase messages: a dropped phase event is still refused', () => {
  const phase = { version: 1, captureId: 'c-1', phase: 'static', url: 'https://new.test/', capturedAt: 1, chunkCount: 0, facts: { phase: 'static', nodeCount: 1, elements: [] } }
  const send = (documentId: string) => new Promise<unknown>((resolve) => {
    const sender = { tab: { id: 43, active: true }, frameId: 0, documentId, url: 'https://new.test/' } as chrome.runtime.MessageSender
    handleAuditMessage({ event: 'document_end', data: phase }, sender, resolve)
  })

  it('replies accepted:false when the store rejects the event, accepted:true for the current document', async () => {
    await commit(43, 'doc-2')
    expect(await send('doc-1')).toEqual({ accepted: false })
    // The handler logs the refusal without awaiting it before replying.
    await vi.waitFor(() => expect(systemLog().some((line) =>
      line.includes('runtime:reject-phase') && line.includes('does not match the current capture'))).toBe(true))
    expect(await send('doc-2')).toEqual({ accepted: true })
  })
})
