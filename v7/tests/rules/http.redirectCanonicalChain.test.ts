import { describe, it, expect } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { redirectCanonicalChainRule as rule } from '@/rules/http/redirectCanonicalChain'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (page: Record<string, unknown>, globals: Record<string, unknown> = {}) =>
  enrichResult(await rule.run(page as any, { globals }), rule, 'test')
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((f) => f.key === key)?.value
const detail = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.detailValues.find((f) => f.key === key)?.value

describe('rule: redirect/canonical chain', () => {
  it('reports the navigation journey as not captured and no canonical when nothing was captured', async () => {
    const r = await run({ html: '', url: 'https://ex.com/', doc: D('<html></html>') })
    expect(r.type).toBe('info'); expect(r.priority).toBe(600)
    expect(value(r, 'Navigation journey')).toBe('Not captured')
    expect(value(r, 'Server redirects')).toBeUndefined()
    expect(value(r, 'Canonical URL')).toBe('Not declared')
    expect(r.presentation?.input).toBe('Static DOM')
    expect(r.presentation?.evidence).toHaveLength(0)
    expect(r.details).toBeUndefined()
  })

  it('renders captured navigation even when the final header object is missing', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://ex.com/b', trace: [
      { url: 'https://ex.com/a', timestamp: 1, type: 'http_redirect', statusCode: 301 },
      { url: 'https://ex.com/b', timestamp: 2, type: 'load', statusCode: 200 },
    ] }
    const page = { html: '', url: 'https://ex.com/b', doc: D('<link rel="canonical" href="https://ex.com/b">'), headers: {},
      headerChain: [{ url: 'https://ex.com/a', status: 301, location: 'https://ex.com/b' }, { url: 'https://ex.com/b', status: 200 }] }
    const r = await run(page, { navigationLedger: ledger })
    expect(r.type).toBe('info')
    expect(r.presentation?.evidence).toHaveLength(3) // 2 hops + canonical element location
    expect(r.presentation?.input).toBe('Navigation events + Main-document HTTP response + Static DOM')
  })

  it('reports the chain as info on a single redirect with canonical match', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://ex.com/b', trace: [
      { url: 'https://ex.com/a', timestamp: 1, type: 'http_redirect', statusCode: 301 },
      { url: 'https://ex.com/b', timestamp: 2, type: 'load', statusCode: 200 },
    ] }
    const page = { html: '', url: 'https://ex.com/b', doc: D('<link rel="canonical" href="https://ex.com/b">'), headers: { 'content-type': 'text/html' },
      headerChain: [{ url: 'https://ex.com/a', status: 301, location: 'https://ex.com/b' }, { url: 'https://ex.com/b', status: 200 }] }
    const r = await run(page, { navigationLedger: ledger })
    expect(r.type).toBe('info'); expect(r.priority).toBe(600)
    expect(value(r, 'Server redirects')).toBe(1)
    expect(value(r, 'Canonical URL')).toBe('Matches final URL')
    expect(detail(r, 'Final URL')).toBe('https://ex.com/b')
    const markup = r.presentation?.markup ?? []
    expect(markup).toHaveLength(1)
    expect(markup[0]?.value).toBe('<link rel="canonical" href="https://ex.com/b">')
    const location = r.presentation?.evidence.find((e) => e.name === 'Canonical element location')
    expect(location?.fields.some((f) => f.key === 'DOM path 1')).toBe(true)
  })

  it('stays info on a multi-hop chain and points canonical at another URL', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://ex.com/c', trace: [
      { url: 'https://ex.com/a', timestamp: 1, type: 'http_redirect', statusCode: 301 },
      { url: 'https://ex.com/b', timestamp: 2, type: 'http_redirect', statusCode: 301 },
      { url: 'https://ex.com/c', timestamp: 3, type: 'load', statusCode: 200 },
    ] }
    const page = { html: '', url: 'https://ex.com/c', doc: D('<link rel="canonical" href="https://ex.com/other">'), headers: { 'content-type': 'text/html' },
      headerChain: [
        { url: 'https://ex.com/a', status: 301, location: 'https://ex.com/b' },
        { url: 'https://ex.com/b', status: 301, location: 'https://ex.com/c' },
        { url: 'https://ex.com/c', status: 200 },
      ] }
    const r = await run(page, { navigationLedger: ledger })
    expect(r.type).toBe('info')
    expect(value(r, 'Server redirects')).toBe(2)
    expect(value(r, 'Canonical URL')).toBe('Points to another preferred URL')
  })

  it('warns on an invalid or unsupported canonical scheme', async () => {
    const page = { html: '', url: 'https://ex.com/', doc: D('<link rel="canonical" href="javascript:alert(1)">'), headers: {} }
    const r = await run(page)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(250)
    expect(value(r, 'Canonical URL')).toBe('Invalid or unsupported scheme')
  })

  it('reports client-side redirect hops separately from server redirects', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://ex.com/b', trace: [
      { url: 'https://ex.com/a', timestamp: 1, type: 'load', statusCode: 200 },
      { url: 'https://ex.com/b', timestamp: 2, type: 'client_redirect', statusCode: 200 },
    ] }
    const r = await run({ html: '', url: 'https://ex.com/b', doc: D('<html></html>'), headers: {} }, { navigationLedger: ledger })
    expect(value(r, 'Client-side redirects')).toBe(1)
    expect(r.presentation?.evidence.find((e) => e.name === 'Hop 2')?.fields.some((f) => f.key === 'Event type' && f.value === 'Client-side redirect')).toBe(true)
  })

  it('preserves all references and emits no legacy details', async () => {
    const r = await run({ html: '', url: 'https://ex.com/', doc: D('<html></html>'), headers: {} })
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
    expect(r.details).toBeUndefined()
  })
})
