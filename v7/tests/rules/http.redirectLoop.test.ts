import { describe, it, expect } from 'vitest'

import { redirectLoopRule } from '@/rules/http/redirectLoop'
import type { NavigationLedger } from '@/background/history/types'

const createMockPage = () => ({
  html: '',
  url: 'https://example.com',
  doc: new DOMParser().parseFromString('<html></html>', 'text/html'),
})

const run = (ledger?: NavigationLedger | null) =>
  redirectLoopRule.run(createMockPage() as any, { globals: { navigationLedger: ledger } })

describe('http:redirect-loop rule', () => {
  it('returns info when no ledger available', async () => {
    const result = await run(null)
    expect(result.type).toBe('info')
    expect(result.message).toContain('No navigation data')
  })

  it('returns ok when no loops detected', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [
        {
          url: 'http://example.com',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('ok')
    expect(result.message).toContain('No redirect loops')
    expect(result.details?.uniqueUrlCount).toBe(2)
  })

  it('detects simple redirect loop', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/a',
      trace: [
        {
          url: 'https://example.com/a',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/b',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/a',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/b',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('error')
    expect(result.message).toContain('Redirect loop')
    expect(result.details?.loopUrls).toHaveLength(2)
    expect(result.details?.loopUrls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: 'https://example.com/a', count: 2 }),
        expect.objectContaining({ url: 'https://example.com/b', count: 2 }),
      ]),
    )
  })

  it('detects self-referential loop', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [
        {
          url: 'https://example.com',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('error')
    expect(result.message).toContain('Redirect loop')
    expect(result.details?.loopUrls).toHaveLength(1)
    expect(result.details?.loopUrls[0]).toEqual({
      url: 'https://example.com',
      count: 3,
    })
  })

  it('handles complex multi-url loop', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/d',
      trace: [
        {
          url: 'https://example.com/a',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/b',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/c',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/a',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/b',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/d',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('error')
    expect(result.message).toContain('Redirect loops')
    expect(result.details?.loopUrls).toHaveLength(2)
  })
})
