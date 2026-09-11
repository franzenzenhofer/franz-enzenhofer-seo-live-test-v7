import { beforeEach, describe, expect, it } from 'vitest'

// Real store (and, for the listener mapping, the real collector) over an
// in-memory storage shim - pattern: background.lifecycle.race.test.ts.
const data: Record<string, unknown> = {}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const keys = (key: string | string[]) => (Array.isArray(key) ? key : [key])
type Listener = (details: Record<string, unknown>) => void
const requestListeners: Record<string, Listener> = {}
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
    .map((name) => [name, { addListener: (listener: Listener) => { requestListeners[name] = listener } }])),
}

const { addEvent, popRun } = await import('@/background/pipeline/store')
const { MAX_TRACKED_FRAMES } = await import('@/background/pipeline/storeFrames')
const { flushCollection } = await import('@/background/pipeline/collector')
const { registerRequestListeners } = await import('@/background/listeners/requests')

const PAGE = 'doc-page', OLD = 'doc-old'
const MAIN = { frameId: 0, parentFrameId: -1 }
const inFrame = (frameId: number, parentFrameId: number, documentId: string | undefined, parentDocumentId: string) =>
  ({ frameId, parentFrameId, documentId, parentDocumentId })
const done = (u: string, identity: object) => ({ t: 'req:done', u, s: 200, ...identity })
const commit = async (tabId: number) => {
  await addEvent(tabId, { t: 'nav:before', u: 'https://new.test/' })
  await addEvent(tabId, { t: 'nav:commit', u: 'https://new.test/', documentId: PAGE })
}
const facts = async (tabId: number) => {
  const run = await popRun(tabId)
  return { urls: run?.resources?.facts.map((fact) => fact.url) ?? [], errors: run?.resources?.errors ?? 0, frames: run?.frames ?? [] }
}

beforeEach(() => { for (const key of Object.keys(data)) delete data[key] })

describe('resource ledger: frame-aware document identity', () => {
  it('keeps main-frame behaviour: the page document is accepted, any other rejected', async () => {
    await commit(51)
    expect(await addEvent(51, done('https://new.test/app.js', { ...MAIN, documentId: PAGE }))).toBe(true)
    expect(await addEvent(51, done('https://old.test/app.js', { ...MAIN, documentId: OLD }))).toBe(false)
    expect((await facts(51)).urls).toEqual(['https://new.test/app.js'])
  })

  it('accepts subresources requested from an iframe of the current page, nested ones too', async () => {
    await commit(52)
    // The iframe's own navigation request has no document yet, only its parent.
    expect(await addEvent(52, { t: 'req:beforeHeaders', u: 'https://ads.test/frame.html', resourceType: 'sub_frame', ...inFrame(5, 0, undefined, PAGE) })).toBe(true)
    expect(await addEvent(52, done('https://ads.test/frame.js', inFrame(5, 0, 'doc-frame', PAGE)))).toBe(true)
    expect(await addEvent(52, done('https://ads.test/nested.js', inFrame(9, 5, 'doc-nested', 'doc-frame')))).toBe(true)
    const ledger = await facts(52)
    expect(ledger.urls).toEqual(['https://ads.test/frame.html', 'https://ads.test/frame.js', 'https://ads.test/nested.js'])
    expect(ledger.frames).toEqual([5, 9])
  })

  it('rejects frames that do not belong to the current page', async () => {
    await commit(53)
    expect(await addEvent(53, done('https://old.test/frame.js', inFrame(7, 0, 'doc-old-frame', OLD)))).toBe(false)
    expect(await addEvent(53, done('https://x.test/orphan.js', inFrame(12, 99, 'doc-orphan', 'doc-unknown')))).toBe(false)
    expect(await addEvent(53, done('https://x.test/prerender.js', { frameId: 20, parentFrameId: -1, documentId: 'doc-prerender' }))).toBe(false)
    expect(await facts(53)).toEqual({ urls: [], errors: 0, frames: [] })
  })

  it('rejects the previous document\'s aborted requests between nav:before and nav:commit', async () => {
    await addEvent(54, { t: 'nav:before', u: 'https://new.test/' })
    const aborted = { t: 'req:error', error: 'net::ERR_ABORTED' }
    expect(await addEvent(54, { ...aborted, u: 'https://old.test/app.js', ...MAIN, documentId: OLD })).toBe(false)
    expect(await addEvent(54, { ...aborted, u: 'https://old.test/frame.js', ...inFrame(3, 0, 'doc-old-frame', OLD) })).toBe(false)
    // A callback without any document identity is attributed as before.
    expect(await addEvent(54, done('https://new.test/unidentified.js', {}))).toBe(true)
    await addEvent(54, { t: 'nav:commit', u: 'https://new.test/', documentId: PAGE })
    expect(await addEvent(54, done('https://new.test/app.js', { ...MAIN, documentId: PAGE }))).toBe(true)
    expect(await facts(54)).toEqual({ urls: ['https://new.test/unidentified.js', 'https://new.test/app.js'], errors: 0, frames: [] })
  })

  it('bounds the tracked frames; direct iframes are still attributed past the cap', async () => {
    await commit(56)
    const total = MAX_TRACKED_FRAMES + 6
    for (let index = 1; index <= total; index++) {
      expect(await addEvent(56, done(`https://ads.test/f-${index}.js`, inFrame(100 + index, 0, `doc-f${index}`, PAGE)))).toBe(true)
    }
    expect(await addEvent(56, done('https://ads.test/deep-last.js', inFrame(900, 100 + total, 'doc-deep', `doc-f${total}`)))).toBe(false)
    expect(await addEvent(56, done('https://ads.test/deep-first.js', inFrame(901, 101, 'doc-deep', 'doc-f1')))).toBe(true)
    const ledger = await facts(56)
    expect(ledger.frames).toHaveLength(MAX_TRACKED_FRAMES)
    expect(ledger.urls).toHaveLength(total + 1)
  })

  it('the webRequest listeners pass the frame identity through to the store', async () => {
    await commit(57)
    registerRequestListeners()
    requestListeners['onCompleted']!({ tabId: 57, type: 'script', url: 'https://ads.test/frame.js', requestId: '1', statusCode: 200,
      fromCache: false, statusLine: 'HTTP/1.1 200 OK', frameId: 4, parentFrameId: 0, documentId: 'doc-frame', parentDocumentId: PAGE })
    await flushCollection(57)
    expect(await facts(57)).toEqual({ urls: ['https://ads.test/frame.js'], errors: 0, frames: [4] })
  })
})
