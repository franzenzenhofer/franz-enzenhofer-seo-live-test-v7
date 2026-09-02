import { describe, it, expect } from 'vitest'

import { navigationPathRule } from '@/rules/http/navigationPath'
import type { NavigationLedger } from '@/background/history/types'

const createMockPage = (headers: Record<string, string> = { 'content-type': 'text/html' }) => ({
  html: '',
  url: 'https://example.com',
  doc: new DOMParser().parseFromString('<html></html>', 'text/html'),
  headers,
})

const run = (ledger?: NavigationLedger | null) =>
  navigationPathRule.run(createMockPage() as any, { globals: { navigationLedger: ledger } })

describe('http:navigation-path rule', () => {
  it('exposes the full webRequest hop chain (URL, status, Location) in the shared shape', async () => {
    const page = {
      ...createMockPage(),
      status: 200,
      headerChain: [
        { url: 'https://example.com/old', status: 301, redirectUrl: 'https://example.com/mid' },
        { url: 'https://example.com/mid', status: 302, redirectUrl: 'https://example.com' },
        { url: 'https://example.com', status: 200 },
      ],
    }
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [
        { url: 'https://example.com/old', timestamp: 1, type: 'http_redirect', statusCode: 301 },
        { url: 'https://example.com/mid', timestamp: 2, type: 'http_redirect', statusCode: 302 },
        { url: 'https://example.com', timestamp: 3, type: 'load', statusCode: 200 },
      ],
    }
    const result = await navigationPathRule.run(page as any, { globals: { navigationLedger: ledger } })
    expect(result.type).toBe('error')
    // The full webRequest hop chain renders once, in details.redirectChainText.
    const chainText = result.details?.['redirectChainText'] as string
    expect(chainText).toContain('HTTP 301 -> Location: https://example.com/mid')
    expect(chainText).toContain('HTTP 302 -> Location: https://example.com/')
    expect(chainText).toContain('FINAL STATUS HTTP 200')
    expect(result.details?.['redirectChain']).toBeUndefined()
    expect(result.message).not.toContain('HTTP 301 -> Location:')
  })

  it('returns runtime_error when headers not captured', async () => {
    const result = await navigationPathRule.run(createMockPage({}) as any, { globals: { navigationLedger: null } })
    expect(result.type).toBe('runtime_error')
    expect(result.message).toContain('Hard Reload')
  })

  it('returns info when no ledger available', async () => {
    const result = await run(null)
    expect(result.type).toBe('info')
    expect(result.message).toContain('unavailable')
  })

  it('returns info when trace is empty', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [],
    }
    const result = await run(ledger)
    expect(result.type).toBe('info')
    expect(result.message).toContain('No navigation events')
  })

  it('returns ok for direct load (no redirects)', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [
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
    expect(result.message).toContain('Direct load')
    expect(result.details?.redirectCount).toBe(0)
  })

  it('returns ok for single permanent HTTP → HTTPS redirect (recommended setup)', async () => {
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
    expect(result.message).toContain('HTTP → HTTPS')
    expect(result.details?.issue).toBe('http_to_https_redirect')
    expect(result.details?.redirectCount).toBe(1)
  })

  it('returns info for a generic single permanent redirect', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/new',
      trace: [
        {
          url: 'https://example.com/old',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/new',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('info')
    expect(result.message).toContain('Single permanent redirect')
    expect(result.details?.redirectCount).toBe(1)
  })

  it('returns warn for temporary redirect (302)', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/new',
      trace: [
        {
          url: 'https://example.com/old',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 302,
        },
        {
          url: 'https://example.com/new',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('warn')
    expect(result.message).toContain('302')
    expect(result.details?.issue).toBe('temp_redirect')
  })

  it('returns warn for temporary redirect (303 See Other)', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/new',
      trace: [
        {
          url: 'https://example.com/old',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 303,
        },
        {
          url: 'https://example.com/new',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('warn')
    expect(result.message).toContain('303')
    expect(result.details?.issue).toBe('temp_redirect')
  })

  it('returns warn for temporary redirect (307 Temporary Redirect)', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/new',
      trace: [
        {
          url: 'https://example.com/old',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 307,
        },
        {
          url: 'https://example.com/new',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('warn')
    expect(result.message).toContain('307')
    expect(result.details?.issue).toBe('temp_redirect')
  })

  it('handles multiple temporary redirect types', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/final',
      trace: [
        {
          url: 'https://example.com/start',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 302,
        },
        {
          url: 'https://example.com/middle',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 307,
        },
        {
          url: 'https://example.com/final',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('error')
    expect(result.details?.issue).toBe('long_chain')
    expect(result.details?.redirectCount).toBe(2)
  })

  it('returns error for client-side redirect', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/redirected',
      trace: [
        {
          url: 'https://example.com',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
        {
          url: 'https://example.com/redirected',
          timestamp: Date.now(),
          type: 'client_redirect',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('error')
    expect(result.message).toContain('Client-side redirect')
    expect(result.details?.issue).toBe('client_redirect')
  })

  it('returns error for redirect chain (multiple hops)', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/final',
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
          type: 'http_redirect',
          statusCode: 301,
        },
        {
          url: 'https://example.com/final',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('error')
    expect(result.message).toContain('Redirect chain')
    expect(result.details?.redirectCount).toBe(2)
    expect(result.details?.issue).toBe('long_chain')
  })

  it('includes trace details in result', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [
        {
          url: 'https://example.com',
          timestamp: Date.now(),
          type: 'load',
          statusCode: 200,
        },
      ],
    }
    const result = await run(ledger)
    expect(result.details?.trace).toBeDefined()
    expect(result.details?.trace).toHaveLength(1)
  })
})
