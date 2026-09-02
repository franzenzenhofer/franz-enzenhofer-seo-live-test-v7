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

const hop = (url: string, type: 'load' | 'http_redirect' | 'client_redirect', statusCode: number) => ({
  url,
  timestamp: Date.now(),
  type,
  statusCode,
})

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

  it('returns ok for direct load with no invented score', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [hop('https://example.com', 'load', 200)],
    }
    const result = await run(ledger)
    expect(result.type).toBe('ok')
    expect(result.message).toContain('Direct load')
    expect(result.details?.score).toBeUndefined()
    expect(result.details?.redirects).toBe(0)
  })

  it('returns ok for a single redirect hop and reports the chain facts', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [hop('http://example.com', 'http_redirect', 301), hop('https://example.com', 'load', 200)],
    }
    const result = await run(ledger)
    expect(result.type).toBe('ok')
    expect(result.message).toContain('1 redirect hop')
    expect(result.details?.score).toBeUndefined()
    expect(result.details?.redirects).toBe(1)
    expect(result.details?.permanentRedirects).toBe(1)
  })

  it('reports temporary-status hops as a fact without a score', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [hop('http://example.com', 'http_redirect', 302), hop('https://example.com', 'load', 200)],
    }
    const result = await run(ledger)
    expect(result.type).toBe('ok')
    expect(result.details?.temporaryRedirects).toBe(1)
    expect(result.message).toContain('1 temporary')
    expect(result.details?.score).toBeUndefined()
  })

  it('warns when the chain has 2 or more redirect hops (Lighthouse redirects audit)', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/final',
      trace: [
        hop('http://example.com', 'http_redirect', 301),
        hop('https://example.com', 'http_redirect', 301),
        hop('https://example.com/final', 'load', 200),
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('warn')
    expect(result.message).toContain('2 redirect hops')
    expect(result.message).toContain('latency')
    expect(result.details?.redirects).toBe(2)
  })

  it('counts client-side redirects in a multi-hop chain', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com/final',
      trace: [
        hop('http://example.com', 'http_redirect', 302),
        hop('https://example.com', 'http_redirect', 302),
        hop('https://example.com/temp', 'client_redirect', 200),
        hop('https://example.com/final', 'load', 200),
      ],
    }
    const result = await run(ledger)
    expect(result.type).toBe('warn')
    expect(result.details?.redirects).toBe(3)
    expect(result.details?.temporaryRedirects).toBe(2)
    expect(result.details?.clientRedirects).toBe(1)
    expect(result.message).toMatch(/client/i)
  })

  it('includes the full chain-fact breakdown in details', async () => {
    const ledger: NavigationLedger = {
      tabId: 1,
      currentUrl: 'https://example.com',
      trace: [hop('http://example.com', 'http_redirect', 301), hop('https://example.com', 'load', 200)],
    }
    const result = await run(ledger)
    expect(result.details).toMatchObject({
      totalHops: 2,
      redirects: 1,
      httpRedirects: 1,
      clientRedirects: 0,
      permanentRedirects: 1,
      temporaryRedirects: 0,
    })
    expect(result.details?.score).toBeUndefined()
  })
})
