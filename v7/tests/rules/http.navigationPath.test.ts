import { describe, it, expect } from 'vitest'

import { navigationPathRule } from '@/rules/http/navigationPath'
import type { NavigationLedger } from '@/background/history/types'

const createMockPage = () => ({
  html: '',
  url: 'https://example.com',
  doc: new DOMParser().parseFromString('<html></html>', 'text/html'),
})

const run = (ledger?: NavigationLedger | null) =>
  navigationPathRule.run(createMockPage() as any, { globals: { navigationLedger: ledger } })

describe('http:navigation-path rule', () => {
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

  it('returns warn for single permanent redirect', async () => {
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
    expect(result.type).toBe('warn')
    expect(result.message).toContain('HTTP → HTTPS')
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
    expect(result.details?.reference).toBeDefined()
  })
})
