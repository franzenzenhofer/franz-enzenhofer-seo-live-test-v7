import { describe, it, expect } from 'vitest'

import { redirectEfficiencyRule } from '@/rules/http/redirectEfficiency'
import type { NavigationLedger } from '@/background/history/types'

const createMockPage = (headers: Record<string, string> = { 'content-type': 'text/html' }) => ({
  html: '',
  url: 'https://example.com',
  doc: new DOMParser().parseFromString('<html></html>', 'text/html'),
  headers,
})

const run = (ledger?: NavigationLedger | null) =>
  redirectEfficiencyRule.run(createMockPage() as any, { globals: { navigationLedger: ledger } })

describe('http:redirect-efficiency rule', () => {
  it('returns runtime_error when headers not captured', async () => {
    const result = await redirectEfficiencyRule.run(createMockPage({}) as any, { globals: { navigationLedger: null } })
    expect(result.type).toBe('runtime_error')
    expect(result.message).toContain('Hard Reload')
  })

  it('returns info when no ledger available', async () => {
    const result = await run(null)
    expect(result.type).toBe('info')
    expect(result.message).toContain('No navigation data')
  })

  it('returns perfect score for direct load', async () => {
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
    expect(result.message).toContain('Perfect')
    expect(result.message).toContain('100/100')
    expect(result.details?.score).toBe(100)
  })

  it('returns good score for single permanent redirect', async () => {
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
    expect(result.details?.score).toBe(85) // 100 - 15 for 1 redirect
    expect(result.message).toContain('Good')
  })

  it('penalizes temporary redirects more', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [
        {
          url: 'http://example.com',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 302,
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
    expect(result.details?.score).toBe(75) // 100 - 15 (redirect) - 10 (temp)
    expect(result.details?.temporaryRedirects).toBe(1)
  })

  it('heavily penalizes client-side redirects', async () => {
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
    expect(result.details?.score).toBe(60) // 100 - 15 (redirect) - 25 (client)
    expect(result.type).toBe('warn')
  })

  it('returns error for multiple problematic redirects', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/final',
      trace: [
        {
          url: 'http://example.com',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 302,
        },
        {
          url: 'https://example.com',
          timestamp: Date.now(),
          type: 'http_redirect',
          statusCode: 302,
        },
        {
          url: 'https://example.com/temp',
          timestamp: Date.now(),
          type: 'client_redirect',
          statusCode: 200,
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
    expect(result.details?.score).toBeLessThan(60)
    expect(result.details?.redirects).toBe(3)
    expect(result.details?.temporaryRedirects).toBe(2)
    expect(result.details?.clientRedirects).toBe(1)
  })

  it('includes detailed breakdown in details', async () => {
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
    expect(result.details).toMatchObject({
      score: 85,
      totalHops: 2,
      redirects: 1,
      httpRedirects: 1,
      clientRedirects: 0,
      permanentRedirects: 1,
      temporaryRedirects: 0,
    })
    expect(result.details?.issues).toHaveLength(1)
  })
})
