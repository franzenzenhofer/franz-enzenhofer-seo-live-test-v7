import { describe, it, expect } from 'vitest'

import { redirectCanonicalChainRule } from '@/rules/http/redirectCanonicalChain'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: redirect/canonical chain', () => {
  it('warns on single redirect with canonical match', async () => {
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
      headerChain: [
        { url: 'https://ex.com/a', status: 301, location: 'https://ex.com/b' },
        { url: 'https://ex.com/b', status: 200 },
      ],
    }
    const r = await redirectCanonicalChainRule.run(page as any, { globals: { navigationLedger: ledger } })
    expect(r.type).toBe('warn')
    expect(r.message).toContain('canonical')
  })
})
