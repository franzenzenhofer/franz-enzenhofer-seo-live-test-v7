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
  it('compares against the page URL and reports no canonical when no navigation was captured', async () => {
    const r = await run({ html: '', url: 'https://ex.com/', doc: D('<html></html>') })
    expect(r.type).toBe('info'); expect(r.priority).toBe(600)
    expect(value(r, 'Redirects')).toBeUndefined()
    expect(r.presentation?.values).toEqual([
      { key: 'Current page URL', value: 'https://ex.com/', kind: 'url' },
      { key: 'Canonical link', value: 'Not found', kind: 'text' },
    ])
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
    // Overview in doctrine order: journey, canonical, what it was compared to, verdict, markup.
    expect(r.presentation?.values).toEqual([
      { key: 'Redirects', value: '1 server, 0 client-side', kind: 'text' },
      { key: 'Canonical URL', value: 'https://ex.com/b', kind: 'url' },
      { key: 'Final URL', value: 'https://ex.com/b', kind: 'url' },
      { key: 'Comparison', value: 'Equals final URL', kind: 'text' },
      { key: '<link rel="canonical">', value: '<link rel="canonical" href="https://ex.com/b">', kind: 'original', fidelity: 'complete-original' },
    ])
    const markup = r.presentation?.markup ?? []
    expect(markup).toHaveLength(1)
    expect(markup[0]?.value).toBe('<link rel="canonical" href="https://ex.com/b">')
    const link = r.presentation?.evidence.find((e) => e.name === '<link rel="canonical">')
    expect(link?.fields.filter((f) => f.kind === 'path').map((f) => f.key)).toEqual(['DOM path'])
    // Two hops plus the canonical link are the records; only the link carries markup.
    expect(detail(r, 'Markup retained')).toBe(1); expect(detail(r, 'Markup omitted')).toBe(2)
    expect(detail(r, 'Evidence retained')).toBe(3); expect(detail(r, 'Evidence omitted')).toBe(0)
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
    expect(value(r, 'Redirects')).toBe('2 server, 0 client-side')
    expect(value(r, 'Canonical URL')).toBe('https://ex.com/other')
    expect(value(r, 'Final URL')).toBe('https://ex.com/c')
    expect(value(r, 'Comparison')).toBe('Differs from final URL (path)')
  })

  it('warns on an invalid or unsupported canonical scheme', async () => {
    const page = { html: '', url: 'https://ex.com/', doc: D('<link rel="canonical" href="javascript:alert(1)">'), headers: {} }
    const r = await run(page)
    expect(r.type).toBe('warn'); expect(r.priority).toBe(250)
    expect(value(r, 'Canonical href')).toBe('javascript:alert(1)')
    expect(value(r, 'Canonical URL')).toBe('Invalid URL')
    expect(value(r, 'Comparison')).toBeUndefined()
  })

  it('reports client-side redirect hops separately from server redirects', async () => {
    const ledger = { tabId: 1, currentUrl: 'https://ex.com/b', trace: [
      { url: 'https://ex.com/a', timestamp: 1, type: 'load', statusCode: 200 },
      { url: 'https://ex.com/b', timestamp: 2, type: 'client_redirect', statusCode: 200 },
    ] }
    const r = await run({ html: '', url: 'https://ex.com/b', doc: D('<html></html>'), headers: {} }, { navigationLedger: ledger })
    expect(value(r, 'Redirects')).toBe('0 server, 1 client-side')
    expect(r.presentation?.evidence.find((e) => e.name === 'Hop 2')?.fields.some((f) => f.key === 'Event type' && f.value === 'Client-side redirect')).toBe(true)
  })

  it('preserves all references and emits no legacy details', async () => {
    const r = await run({ html: '', url: 'https://ex.com/', doc: D('<html></html>'), headers: {} })
    const copy = toResultCopyPayload(r)
    for (const ref of rule.meta.references) expect(copy).toContain(ref)
    expect(r.details).toBeUndefined()
  })
})
