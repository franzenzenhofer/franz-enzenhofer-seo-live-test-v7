import { describe, it, expect } from 'vitest'

import { canonicalHostRedirectRule } from '@/rules/http/canonicalHostRedirect'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: www/non-www canonical redirect', () => {
  it('ok on single-hop permanent www -> non-www redirect', async () => {
    const ledger = {
      tabId: 1,
      currentUrl: 'https://example.com/page?x=1',
      trace: [
        { url: 'https://www.example.com/page?x=1', timestamp: 1, type: 'http_redirect', statusCode: 301, statusText: '301' },
        { url: 'https://example.com/page?x=1', timestamp: 2, type: 'load', statusCode: 200, statusText: '200' },
      ],
    }

    const page = {
      html: '',
      url: 'https://example.com/page?x=1',
      doc: D('<html><head></head><body></body></html>'),
      headers: { 'content-type': 'text/html' },
    }

    const r = await canonicalHostRedirectRule.run(page as any, { globals: { navigationLedger: ledger } })
    expect(r.type).toBe('ok')
    expect(r.message).toContain('Single-hop')
  })

  it('errors when canonical swaps host without redirect', async () => {
    const ledger = {
      tabId: 1,
      currentUrl: 'https://www.example.com/page',
      trace: [
        { url: 'https://www.example.com/page', timestamp: 1, type: 'load', statusCode: 200, statusText: '200' },
      ],
    }

    const page = {
      html: '',
      url: 'https://www.example.com/page',
      doc: D('<link rel="canonical" href="https://example.com/page">'),
      headers: { 'content-type': 'text/html' },
    }

    const r = await canonicalHostRedirectRule.run(page as any, { globals: { navigationLedger: ledger } })
    expect(r.type).toBe('error')
    expect(r.message).toContain('Canonical points to the alternate host')
  })

  it('errors on temporary www/non-www redirect', async () => {
    const ledger = {
      tabId: 1,
      currentUrl: 'https://example.com/',
      trace: [
        { url: 'https://www.example.com/', timestamp: 1, type: 'http_redirect', statusCode: 302, statusText: '302' },
        { url: 'https://example.com/', timestamp: 2, type: 'load', statusCode: 200, statusText: '200' },
      ],
    }

    const page = {
      html: '',
      url: 'https://example.com/',
      doc: D('<html><head></head><body></body></html>'),
      headers: { 'content-type': 'text/html' },
    }

    const r = await canonicalHostRedirectRule.run(page as any, { globals: { navigationLedger: ledger } })
    expect(r.type).toBe('error')
    expect(r.message).toContain('Temporary redirect')
  })
})
