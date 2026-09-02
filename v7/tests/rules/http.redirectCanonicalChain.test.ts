import { describe, it, expect } from 'vitest'

import { redirectCanonicalChainRule } from '@/rules/http/redirectCanonicalChain'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: redirect/canonical chain', () => {
  it('returns runtime_error when headers not captured', async () => {
    const ledger = {
      tabId: 1,
      currentUrl: 'https://ex.com/b',
      trace: [
        { url: 'https://ex.com/a', timestamp: 1, type: 'http_redirect', statusCode: 301, statusText: '301' },
        { url: 'https://ex.com/b', timestamp: 2, type: 'load', statusCode: 200, statusText: '200' },
      ],
    }
    const page = {
      html: '',
      url: 'https://ex.com/b',
      doc: D('<link rel="canonical" href="https://ex.com/b">'),
      headers: {},
      headerChain: [
        { url: 'https://ex.com/a', status: 301, location: 'https://ex.com/b' },
        { url: 'https://ex.com/b', status: 200 },
      ],
    }
    const r = await redirectCanonicalChainRule.run(page as any, { globals: { navigationLedger: ledger } })
    expect(r.type).toBe('runtime_error')
    expect(r.message).toContain('Hard Reload')
  })

  it('reports the chain as info on a single redirect with canonical match', async () => {
    const ledger = {
      tabId: 1,
      currentUrl: 'https://ex.com/b',
      trace: [
        { url: 'https://ex.com/a', timestamp: 1, type: 'http_redirect', statusCode: 301, statusText: '301' },
        { url: 'https://ex.com/b', timestamp: 2, type: 'load', statusCode: 200, statusText: '200' },
      ],
    }
    const page = {
      html: '',
      url: 'https://ex.com/b',
      doc: D('<link rel="canonical" href="https://ex.com/b">'),
      headers: { 'content-type': 'text/html' },
      headerChain: [
        { url: 'https://ex.com/a', status: 301, location: 'https://ex.com/b' },
        { url: 'https://ex.com/b', status: 200 },
      ],
    }
    const r = await redirectCanonicalChainRule.run(page as any, { globals: { navigationLedger: ledger } })
    // The chain is a visualization; hop-count judgment belongs to http:redirect-efficiency.
    expect(r.type).toBe('info')
    expect(r.message).toContain('canonical')
  })

  it('stays info on a multi-hop chain (hop-count judgment lives in http:redirect-efficiency)', async () => {
    const ledger = {
      tabId: 1,
      currentUrl: 'https://ex.com/c',
      trace: [
        { url: 'https://ex.com/a', timestamp: 1, type: 'http_redirect', statusCode: 301, statusText: '301' },
        { url: 'https://ex.com/b', timestamp: 2, type: 'http_redirect', statusCode: 301, statusText: '301' },
        { url: 'https://ex.com/c', timestamp: 3, type: 'load', statusCode: 200, statusText: '200' },
      ],
    }
    const page = {
      html: '',
      url: 'https://ex.com/c',
      doc: D('<link rel="canonical" href="https://ex.com/c">'),
      headers: { 'content-type': 'text/html' },
      headerChain: [
        { url: 'https://ex.com/a', status: 301, location: 'https://ex.com/b' },
        { url: 'https://ex.com/b', status: 301, location: 'https://ex.com/c' },
        { url: 'https://ex.com/c', status: 200 },
      ],
    }
    const r = await redirectCanonicalChainRule.run(page as any, { globals: { navigationLedger: ledger } })
    expect(r.type).toBe('info')
    expect(r.details?.redirectCount).toBe(2)
  })
})
